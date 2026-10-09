import "server-only";

import { Context, Effect, Layer } from "effect";
import {
	findUserExerciseIdByNormalizedName,
	deleteUserExercise,
	listUserExerciseCatalog,
	listExercisesByCategory,
	searchExercises,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";
import {
	findOrCreateWorkoutExercises,
	type PreparedWorkoutWriteExercise,
	type WorkoutExerciseWithDatabaseId,
} from "@/server/exercises/library/workout-exercises.db";
import { DatabaseError } from "@/lib/db/database";
import { ExerciseNotFoundError } from "@/server/exercises/library/library.functions";

import {
	getUserExerciseLibraryRow,
	mergeUserExerciseRows,
	replaceExerciseMuscleGroups,
} from "@/server/exercises/library/library.db";

export interface UserExerciseLibraryRow {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

import type { PrHistoryCutoff } from "@/server/exercises/pr-history/pr-history.functions";

type ExerciseWriteInput = {
	userId: string;
	exercise: {
		name: string;
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

export class ExerciseDb extends Context.Service<
	ExerciseDb,
	{
		readonly create: (
			input: ExerciseWriteInput,
		) => Effect.Effect<UserExerciseLibraryRow, DatabaseError>;
		readonly update: (
			input: ExerciseWriteInput & { exerciseId: string },
		) => Effect.Effect<UserExerciseLibraryRow, DatabaseError | ExerciseNotFoundError>;
		readonly merge: (input: {
			userId: string;
			sourceId: string;
			targetId: string;
			sourceMuscleGroups: Array<{ name: string; normalizedName: string }> | null;
		}) => Effect.Effect<PrHistoryCutoff | null, DatabaseError | ExerciseNotFoundError>;
		readonly resolveWorkoutExercises: (input: {
			userId: string;
			exercises: PreparedWorkoutWriteExercise[];
		}) => Effect.Effect<WorkoutExerciseWithDatabaseId[], DatabaseError>;
		readonly findUserExerciseIdByNormalizedName: (query: {
			userId: string;
			normalizedName: string;
		}) => Effect.Effect<string | null, DatabaseError>;
		readonly getUserExercise: (query: {
			userId: string;
			exerciseId: string;
		}) => Effect.Effect<UserExerciseLibraryRow | null, DatabaseError>;
		readonly deleteUserExercise: (query: {
			userId: string;
			exerciseId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly listUserExercises: (
			userId: string,
		) => Effect.Effect<UserExerciseLibraryRow[], DatabaseError>;
		readonly listByCategory: (query: {
			userId: string;
			normalizedMuscleNames: string[];
		}) => Effect.Effect<
			Array<{ id: string; name: string; normalizedName: string; muscleGroups: string[] }>,
			DatabaseError
		>;
		readonly searchExercises: (query: {
			userId: string;
			normalizedQuery: string;
		}) => Effect.Effect<
			Array<{ id: string; name: string; normalizedName: string; muscleGroups: string[] }>,
			DatabaseError
		>;
	}
>()("horus/ExerciseDb") {}

export const exerciseDbLayer = Layer.effect(
	ExerciseDb,
	Effect.gen(function* () {
		const connection = yield* DbConnection;

		return {
			create: ({ userId, exercise }) =>
				Effect.gen(function* () {
					const created = yield* Effect.tryPromise({
						try: () =>
							connection.exercises.create({
								data: {
									user_id: userId,
									name: exercise.name,
									normalized_name: exercise.normalizedName,
								},
								select: { id: true },
							}),
						catch: (cause) => new DatabaseError({ cause }),
					});

					yield* replaceExerciseMuscleGroups(connection, created.id, exercise.muscleGroups);

					const row = yield* getUserExerciseLibraryRow(connection, userId, created.id);

					if (!row)
						return yield* Effect.fail(
							new DatabaseError({ cause: new Error("Created exercise row was not found") }),
						);

					return row;
				}),
			update: ({ userId, exerciseId, exercise }) =>
				Effect.gen(function* () {
					const updated = yield* Effect.tryPromise({
						try: () =>
							connection.exercises.updateMany({
								where: { id: exerciseId, user_id: userId },
								data: { name: exercise.name, normalized_name: exercise.normalizedName },
							}),
						catch: (cause) => new DatabaseError({ cause }),
					});

					// Stop before changing muscle groups when the owned exercise no longer exists.
					if (updated.count === 0) return yield* Effect.fail(new ExerciseNotFoundError());
					yield* replaceExerciseMuscleGroups(connection, exerciseId, exercise.muscleGroups);

					const row = yield* getUserExerciseLibraryRow(connection, userId, exerciseId);

					if (!row) return yield* Effect.fail(new ExerciseNotFoundError());

					return row;
				}),
			merge: ({ userId, sourceId, targetId, sourceMuscleGroups }) =>
				Effect.gen(function* () {
					if (sourceId === targetId) return yield* Effect.fail(new ExerciseNotFoundError());

					const result = yield* mergeUserExerciseRows(
						connection,
						userId,
						sourceId,
						targetId,
						sourceMuscleGroups,
					);

					if (!result) return yield* Effect.fail(new ExerciseNotFoundError());

					return result.cutoff;
				}),
			resolveWorkoutExercises: ({ userId, exercises }) =>
				findOrCreateWorkoutExercises(connection, userId, exercises),
			findUserExerciseIdByNormalizedName: ({ userId, normalizedName }) =>
				Effect.tryPromise({
					try: async (): Promise<string | null> => {
						const [row] = await connection.$queryRawTyped(
							findUserExerciseIdByNormalizedName(userId, normalizedName),
						);

						return row?.id ?? null;
					},
					catch: (cause) => new DatabaseError({ cause }),
				}),
			getUserExercise: ({ userId, exerciseId }) =>
				getUserExerciseLibraryRow(connection, userId, exerciseId),
			deleteUserExercise: ({ userId, exerciseId }) =>
				Effect.tryPromise({
					try: async () => {
						await connection.$queryRawTyped(deleteUserExercise(userId, exerciseId));
					},
					catch: (cause) => new DatabaseError({ cause }),
				}),
			listUserExercises: (userId) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(listUserExerciseCatalog(userId)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map(
						(row): UserExerciseLibraryRow => ({
							id: row.id,
							name: row.name,
							muscleGroups: row.muscle_groups ?? [],
							workoutCount: row.workout_count ?? 0,
						}),
					);
				}),
			listByCategory: ({ userId, normalizedMuscleNames }) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () =>
							connection.$queryRawTyped(listExercisesByCategory(userId, normalizedMuscleNames)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map((row) => ({
						id: row.id,
						name: row.name,
						normalizedName: row.normalized_name,
						muscleGroups: row.muscle_groups ?? [],
					}));
				}),
			searchExercises: ({ userId, normalizedQuery }) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(searchExercises(userId, normalizedQuery)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map((row) => ({
						id: row.id,
						name: row.name,
						normalizedName: row.normalized_name,
						muscleGroups: row.muscle_groups ?? [],
					}));
				}),
		} satisfies ExerciseDb["Service"];
	}),
);

export const exerciseDb = exerciseDbLayer.pipe(Layer.provide(Layer.succeed(DbConnection, prisma)));
