import "server-only";

import { Effect } from "effect";
import {
	getUserExerciseCatalogRow as getUserExerciseLibraryRowQuery,
	listUserExerciseCatalog,
	listExercisesByCategory,
	searchExercises,
} from "@/generated/prisma/sql";
import { prisma, runDatabaseTransaction, type DatabaseTransaction } from "@/lib/db";
import { Database, DatabaseError } from "@/lib/db/database";
import { tryPromise } from "@/lib/tryPromise";
import type { PrHistoryCutoff } from "@/server/exercises/pr-history/pr-history.functions";

type Tx = DatabaseTransaction;

export interface UserExerciseLibraryRow {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

async function getUserExerciseLibraryRow(
	tx: Tx,
	userId: string,
	exerciseId: string,
): Promise<UserExerciseLibraryRow | null> {
	const [row] = await tx.$queryRawTyped(getUserExerciseLibraryRowQuery(userId, exerciseId));

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

export async function getOrCreateMuscleGroupId(
	tx: Tx,
	muscleGroup: { name: string; normalizedName: string },
): Promise<string> {
	const row = await tx.muscle_groups.upsert({
		where: { normalized_name: muscleGroup.normalizedName },
		create: {
			name: muscleGroup.name,
			normalized_name: muscleGroup.normalizedName,
		},
		update: {},
		select: { id: true },
	});

	return row.id;
}

async function getExerciseMuscleGroupNormalizedNames(
	tx: Tx,
	exerciseId: string,
): Promise<string[]> {
	const rows = await tx.exercise_muscle_groups.findMany({
		where: { exercise_id: exerciseId },
		select: {
			muscle_groups: {
				select: { normalized_name: true },
			},
		},
	});

	return rows.map((row) => row.muscle_groups.normalized_name).toSorted();
}

function exerciseMuscleGroupsUnchanged(
	currentNormalizedNames: string[],
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): boolean {
	if (currentNormalizedNames.length !== muscleGroupsForExercise.length) {
		return false;
	}

	const incomingNormalizedNames = muscleGroupsForExercise
		.map((muscleGroup) => muscleGroup.normalizedName)
		.toSorted();

	return currentNormalizedNames.every(
		(normalizedName, index) => normalizedName === incomingNormalizedNames[index],
	);
}

async function replaceExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): Promise<void> {
	const currentNormalizedNames = await getExerciseMuscleGroupNormalizedNames(tx, exerciseId);

	if (exerciseMuscleGroupsUnchanged(currentNormalizedNames, muscleGroupsForExercise)) {
		return;
	}

	await tx.exercise_muscle_groups.deleteMany({
		where: { exercise_id: exerciseId },
	});

	if (muscleGroupsForExercise.length === 0) {
		return;
	}

	const muscleGroupIds = await Promise.all(
		muscleGroupsForExercise.map((muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup)),
	);

	await tx.exercise_muscle_groups.createMany({
		data: muscleGroupIds.map((muscleGroupId) => ({
			exercise_id: exerciseId,
			muscle_group_id: muscleGroupId,
		})),
		skipDuplicates: true,
	});
}

export function findUserExerciseIdByNormalizedName(userId: string, normalizedName: string) {
	return tryPromise({
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
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getUserExerciseRow(userId: string, exerciseId: string) {
	return tryPromise({
		try: () => getUserExerciseLibraryRow(prisma, userId, exerciseId),
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
			runDatabaseTransaction(async (tx): Promise<UserExerciseLibraryRow> => {
				const createdExercise = await tx.exercises.create({
					data: {
						user_id: userId,
						name,
						normalized_name: normalizedName,
					},
					select: { id: true },
				});

				await replaceExerciseMuscleGroups(tx, createdExercise.id, muscleGroupsForExercise);

				const row = await getUserExerciseLibraryRow(tx, userId, createdExercise.id);

				if (!row) {
					throw new Error("Created exercise row was not found");
				}

				return row;
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
			runDatabaseTransaction(async (tx): Promise<UserExerciseLibraryRow> => {
				await tx.exercises.updateMany({
					where: {
						id: exerciseId,
						user_id: userId,
					},
					data: {
						name,
						normalized_name: normalizedName,
					},
				});

				await replaceExerciseMuscleGroups(tx, exerciseId, muscleGroupsForExercise);

				const row = await getUserExerciseLibraryRow(tx, userId, exerciseId);

				if (!row) {
					throw new Error("Updated exercise row was not found");
				}

				return row;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function deleteUserExercise(userId: string, exerciseId: string) {
	return tryPromise({
		try: async (): Promise<void> => {
			await prisma.exercises.deleteMany({
				where: {
					id: exerciseId,
					user_id: userId,
				},
			});
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

async function unionSourceMuscleGroupsOntoTarget(
	tx: Tx,
	sourceId: string,
	targetId: string,
): Promise<void> {
	const sourceLinks = await tx.exercise_muscle_groups.findMany({
		where: { exercise_id: sourceId },
		select: { muscle_group_id: true },
	});

	if (sourceLinks.length === 0) {
		return;
	}

	await tx.exercise_muscle_groups.createMany({
		data: sourceLinks.map(({ muscle_group_id }) => ({
			exercise_id: targetId,
			muscle_group_id,
		})),
		skipDuplicates: true,
	});
}

async function getEarliestAffectedWorkoutCutoff(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
): Promise<PrHistoryCutoff | null> {
	const row = await tx.workouts.findFirst({
		where: {
			user_id: userId,
			workout_exercises: {
				some: {
					exercise_id: { in: exerciseIds },
				},
			},
		},
		orderBy: [{ created_at: "asc" }, { id: "asc" }],
		select: {
			id: true,
			created_at: true,
		},
	});

	if (!row) {
		return null;
	}

	return {
		workoutId: row.id,
		createdAt: row.created_at,
	};
}

export async function mergeUserExerciseRows(
	tx: Tx,
	userId: string,
	sourceId: string,
	targetId: string,
	sourceMuscleGroupsForExercise: Array<{ name: string; normalizedName: string }> | null = null,
) {
	if (sourceId === targetId) {
		throw new Error("Cannot merge an exercise into itself");
	}

	const [source, target] = await Promise.all([
		tx.exercises.findFirst({
			where: {
				id: sourceId,
				user_id: userId,
			},
			select: { id: true },
		}),
		tx.exercises.findFirst({
			where: {
				id: targetId,
				user_id: userId,
			},
			select: { id: true },
		}),
	]);

	if (!source || !target) {
		throw new Error("Source or target exercise not found");
	}

	if (sourceMuscleGroupsForExercise !== null) {
		await replaceExerciseMuscleGroups(tx, sourceId, sourceMuscleGroupsForExercise);
	}

	const cutoff = await getEarliestAffectedWorkoutCutoff(tx, userId, [sourceId, targetId]);

	await unionSourceMuscleGroupsOntoTarget(tx, sourceId, targetId);

	await tx.workout_exercises.updateMany({
		where: { exercise_id: sourceId },
		data: { exercise_id: targetId },
	});

	await tx.exercises.deleteMany({
		where: {
			id: sourceId,
			user_id: userId,
		},
	});

	return cutoff;
}

export const listUserExerciseRows = Effect.fn("exercises.listUserExerciseRows")(function* (
	userId: string,
) {
	const { prisma: database } = yield* Database;

	const rows = yield* Effect.tryPromise({
		try: () => database.$queryRawTyped(listUserExerciseCatalog(userId)),
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
});

export function listExerciseRowsByCategory(userId: string, normalizedMuscleNames: string[]) {
	return tryPromise({
		try: async () => {
			const rows = await prisma.$queryRawTyped(
				listExercisesByCategory(userId, normalizedMuscleNames),
			);

			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				muscleGroups: row.muscle_groups ?? [],
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function searchExerciseRows(userId: string, normalizedQuery: string) {
	return tryPromise({
		try: async () => {
			const rows = await prisma.$queryRawTyped(searchExercises(userId, normalizedQuery));

			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				muscleGroups: row.muscle_groups ?? [],
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
