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
} from "@/server/exercises/library/workout-exercises.repository";
import { DatabaseError } from "@/lib/db/database";

import {
	getUserExerciseLibraryRow,
	mergeUserExerciseRows,
} from "@/server/exercises/library/library.repository";

export interface UserExerciseLibraryRow {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

import type { PrHistoryCutoff } from "@/server/exercises/pr-history/pr-history.functions";

export class ExerciseDb extends Context.Service<
	ExerciseDb,
	{
		readonly merge: (input: {
			userId: string;
			sourceId: string;
			targetId: string;
			sourceMuscleGroups: Array<{ name: string; normalizedName: string }> | null;
		}) => Effect.Effect<PrHistoryCutoff | null, DatabaseError>;
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
			merge: ({ userId, sourceId, targetId, sourceMuscleGroups }) =>
				Effect.tryPromise({
					try: () =>
						mergeUserExerciseRows(connection, userId, sourceId, targetId, sourceMuscleGroups),
					catch: (cause) => new DatabaseError({ cause }),
				}),
			resolveWorkoutExercises: ({ userId, exercises }) =>
				Effect.tryPromise({
					try: () => findOrCreateWorkoutExercises(connection, userId, exercises),
					catch: (cause) => new DatabaseError({ cause }),
				}),
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
				Effect.tryPromise({
					try: () => getUserExerciseLibraryRow(connection, userId, exerciseId),
					catch: (cause) => new DatabaseError({ cause }),
				}),
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
