import "server-only";

import {
	getUserExerciseCatalogRow as getUserExerciseLibraryRowQuery,
	getExerciseMuscleGroupNormalizedNames as getExerciseMuscleGroupNormalizedNamesQuery,
	unionExerciseMuscleGroups,
	getEarliestAffectedWorkoutCutoff as getEarliestAffectedWorkoutCutoffQuery,
	getUserExerciseId,
	deleteUserExercise,
	deleteExerciseMuscleGroups,
} from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import type { UserExerciseLibraryRow } from "@/server/exercises/library/exercises.db";
import type { PrHistoryCutoff } from "@/server/exercises/pr-history/pr-history.functions";

type Tx = DatabaseTransaction;

export async function getUserExerciseLibraryRow(
	database: Tx,
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
	const rows = await tx.$queryRawTyped(getExerciseMuscleGroupNormalizedNamesQuery(exerciseId));

	return rows.map((row) => row.normalized_name).toSorted();
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

export async function replaceExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): Promise<void> {
	const currentNormalizedNames = await getExerciseMuscleGroupNormalizedNames(tx, exerciseId);

	if (exerciseMuscleGroupsUnchanged(currentNormalizedNames, muscleGroupsForExercise)) {
		return;
	}

	await tx.$queryRawTyped(deleteExerciseMuscleGroups(exerciseId));

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

async function getEarliestAffectedWorkoutCutoff(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
): Promise<PrHistoryCutoff | null> {
	const [row] = await tx.$queryRawTyped(getEarliestAffectedWorkoutCutoffQuery(userId, exerciseIds));

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
	const [sourceRows, targetRows] = await Promise.all([
		tx.$queryRawTyped(getUserExerciseId(userId, sourceId)),
		tx.$queryRawTyped(getUserExerciseId(userId, targetId)),
	]);

	const [source] = sourceRows;
	const [target] = targetRows;

	if (!source || !target) {
		return null;
	}

	if (sourceMuscleGroupsForExercise !== null) {
		await replaceExerciseMuscleGroups(tx, sourceId, sourceMuscleGroupsForExercise);
	}

	const cutoff = await getEarliestAffectedWorkoutCutoff(tx, userId, [sourceId, targetId]);

	await tx.$queryRawTyped(unionExerciseMuscleGroups(sourceId, targetId));

	await tx.workout_exercises.updateMany({
		where: { exercise_id: sourceId },
		data: { exercise_id: targetId },
	});

	await tx.$queryRawTyped(deleteUserExercise(userId, sourceId));

	return { cutoff };
}
