import "server-only";

import { Context, Effect, Layer } from "effect";
import {
	getUserExerciseCatalogRow as getUserExerciseLibraryRowQuery,
	listUserExerciseCatalog,
	listExercisesByCategory,
	searchExercises,
} from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import { prisma } from "@/lib/db";
import { DatabaseError } from "@/lib/db/database";

type ExerciseLibraryQueryClient = typeof prisma | DatabaseTransaction;

export interface UserExerciseLibraryRow {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

export async function getUserExerciseLibraryRow(
	database: ExerciseLibraryQueryClient,
	userId: string,
	exerciseId: string,
): Promise<UserExerciseLibraryRow | null> {
	const [row] = await database.$queryRawTyped(getUserExerciseLibraryRowQuery(userId, exerciseId));

	if (!row) {
		return null;
	}

	return {
		id: row.id,
		name: row.name,
		muscleGroups: row.muscle_groups ?? [],
		workoutCount: row.workout_count ?? 0,
	};
}

export class ExerciseDb extends Context.Service<
	ExerciseDb,
	{
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

export const exerciseDb = Layer.succeed(ExerciseDb, {
	findUserExerciseIdByNormalizedName: ({ userId, normalizedName }) =>
		Effect.tryPromise({
			try: async (): Promise<string | null> => {
				const row = await prisma.exercises.findFirst({
					where: {
						user_id: userId,
						normalized_name: normalizedName,
					},
					select: { id: true },
				});

				return row?.id ?? null;
			},
			catch: (cause) => new DatabaseError({ cause }),
		}),
	getUserExercise: ({ userId, exerciseId }) =>
		Effect.tryPromise({
			try: () => getUserExerciseLibraryRow(prisma, userId, exerciseId),
			catch: (cause) => new DatabaseError({ cause }),
		}),
	deleteUserExercise: ({ userId, exerciseId }) =>
		Effect.tryPromise({
			try: async () => {
				await prisma.exercises.deleteMany({
					where: {
						id: exerciseId,
						user_id: userId,
					},
				});
			},
			catch: (cause) => new DatabaseError({ cause }),
		}),
	listUserExercises: (userId) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () => prisma.$queryRawTyped(listUserExerciseCatalog(userId)),
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
				try: () => prisma.$queryRawTyped(listExercisesByCategory(userId, normalizedMuscleNames)),
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
				try: () => prisma.$queryRawTyped(searchExercises(userId, normalizedQuery)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				muscleGroups: row.muscle_groups ?? [],
			}));
		}),
});
