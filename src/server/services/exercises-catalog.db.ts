import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db, runDatabaseTransaction, type DatabaseTransaction } from "@/lib/db";
import { exerciseMuscleGroups, exercises, muscleGroups, workoutExercises } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

type Tx = DatabaseTransaction;

export interface UserExerciseCatalogRow {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

const userExerciseCatalogSelect = {
	id: exercises.id,
	name: exercises.name,
	muscleGroups: sql<string[]>`coalesce(
		array_agg(${muscleGroups.name} order by ${muscleGroups.name})
			filter (where ${muscleGroups.name} is not null),
		array[]::text[]
	)`,
	workoutCount: sql<number>`(
		select count(*)::integer
		from ${workoutExercises}
		where ${workoutExercises.exerciseId} = ${exercises.id}
	)`,
};

function userExerciseCatalogQuery() {
	return db
		.select(userExerciseCatalogSelect)
		.from(exercises)
		.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
		.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
		.groupBy(exercises.id);
}

async function getOrCreateMuscleGroupId(
	tx: Tx,
	muscleGroup: { name: string; normalizedName: string },
): Promise<string> {
	const [createdMuscleGroup] = await tx
		.insert(muscleGroups)
		.values(muscleGroup)
		.onConflictDoNothing()
		.returning({ id: muscleGroups.id });

	if (createdMuscleGroup) {
		return createdMuscleGroup.id;
	}

	const [existingMuscleGroup] = await tx
		.select({ id: muscleGroups.id })
		.from(muscleGroups)
		.where(eq(muscleGroups.normalizedName, muscleGroup.normalizedName))
		.limit(1);

	if (!existingMuscleGroup) {
		throw new Error("Muscle group conflict did not resolve to an existing row");
	}

	return existingMuscleGroup.id;
}

async function replaceExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): Promise<void> {
	await tx.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, exerciseId));

	if (muscleGroupsForExercise.length === 0) {
		return;
	}

	const muscleGroupIds = await Promise.all(
		muscleGroupsForExercise.map((muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup)),
	);

	await tx
		.insert(exerciseMuscleGroups)
		.values(muscleGroupIds.map((muscleGroupId) => ({ exerciseId, muscleGroupId })))
		.onConflictDoNothing();
}

export function getUserExerciseRow(userId: string, exerciseId: string) {
	return tryPromise({
		try: async (): Promise<UserExerciseCatalogRow | null> => {
			const [row] = await userExerciseCatalogQuery()
				.where(and(eq(exercises.userId, userId), eq(exercises.id, exerciseId)))
				.limit(1);

			return row ?? null;
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function findUserExerciseRowByNormalizedName(userId: string, normalizedName: string) {
	return tryPromise({
		try: async (): Promise<UserExerciseCatalogRow | null> => {
			const [row] = await userExerciseCatalogQuery()
				.where(and(eq(exercises.userId, userId), eq(exercises.normalizedName, normalizedName)))
				.limit(1);

			return row ?? null;
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function insertUserExercise(
	userId: string,
	name: string,
	normalizedName: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx): Promise<string> => {
				const [createdExercise] = await tx
					.insert(exercises)
					.values({
						userId,
						name,
						normalizedName,
					})
					.returning({ id: exercises.id });

				await replaceExerciseMuscleGroups(tx, createdExercise!.id, muscleGroupsForExercise);

				return createdExercise!.id;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function updateUserExerciseRow(
	userId: string,
	exerciseId: string,
	name: string,
	normalizedName: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx): Promise<void> => {
				await tx
					.update(exercises)
					.set({
						name,
						normalizedName,
					})
					.where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));

				await replaceExerciseMuscleGroups(tx, exerciseId, muscleGroupsForExercise);
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function deleteUserExercise(userId: string, exerciseId: string) {
	return tryPromise({
		try: async (): Promise<void> => {
			await db
				.delete(exercises)
				.where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function listUserExerciseRows(userId: string) {
	return tryPromise({
		try: () =>
			db
				.select({
					id: exercises.id,
					name: exercises.name,
					muscleGroups: sql<string[]>`coalesce(
						array_agg(${muscleGroups.name} order by ${muscleGroups.name})
							filter (where ${muscleGroups.name} is not null),
						array[]::text[]
					)`,
					workoutCount: sql<number>`(
						select count(*)::integer
						from ${workoutExercises}
						where ${workoutExercises.exerciseId} = ${exercises.id}
					)`,
				})
				.from(exercises)
				.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
				.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
				.where(eq(exercises.userId, userId))
				.groupBy(exercises.id)
				.orderBy(asc(exercises.name)),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
