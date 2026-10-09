import "server-only";

import { Effect } from "effect";
import type { DatabaseTransaction } from "@/lib/db";
import { Database, DatabaseError } from "@/lib/db/database";
import {
	getUserExerciseLibraryRow,
	type UserExerciseLibraryRow,
} from "@/server/exercises/library/exercises.db";
import type { PrHistoryCutoff } from "@/server/exercises/pr-history/pr-history.functions";

type Tx = DatabaseTransaction;

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

export const insertUserExercise = (
	userId: string,
	name: string,
	normalizedName: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;

		return yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx): Promise<UserExerciseLibraryRow> => {
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
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const updateUserExerciseRow = (
	userId: string,
	exerciseId: string,
	name: string,
	normalizedName: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;

		return yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx): Promise<UserExerciseLibraryRow> => {
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
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

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
