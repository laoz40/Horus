import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import type { DatabaseTransaction } from "@/lib/db";
import { getOrCreateMuscleGroupId } from "@/server/exercises/library/library.repository";

type Tx = DatabaseTransaction;

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

export type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

export type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

async function findSubmittedExerciseId(
	tx: Tx,
	userId: string,
	exerciseId: string,
	normalizedName: string,
) {
	const exercise = await tx.exercises.findFirst({
		where: {
			id: exerciseId,
			user_id: userId,
			normalized_name: normalizedName,
		},
		select: { id: true },
	});

	return exercise?.id;
}

async function findExerciseIdByNormalizedName(tx: Tx, userId: string, normalizedName: string) {
	const exercise = await tx.exercises.findFirst({
		where: {
			user_id: userId,
			normalized_name: normalizedName,
		},
		select: { id: true },
	});

	return exercise?.id;
}

async function insertExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): Promise<void> {
	const muscleGroupIds = await Promise.all(
		muscleGroupsForExercise.map((muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup)),
	);

	if (muscleGroupIds.length === 0) return;

	await tx.exercise_muscle_groups.createMany({
		data: muscleGroupIds.map((muscleGroupId) => ({
			exercise_id: exerciseId,
			muscle_group_id: muscleGroupId,
		})),
		skipDuplicates: true,
	});
}

async function createOrGetExercise(
	tx: Tx,
	userId: string,
	exercise: PreparedWorkoutWriteExercise,
): Promise<string> {
	const createResult = await tx.exercises.createMany({
		data: [
			{
				user_id: userId,
				name: exercise.global.name,
				normalized_name: exercise.global.normalizedName,
			},
		],
		skipDuplicates: true,
	});

	const exerciseId = await findExerciseIdByNormalizedName(
		tx,
		userId,
		exercise.global.normalizedName,
	);

	if (!exerciseId) {
		throw new Error("Exercise conflict did not resolve to an existing row");
	}

	if (createResult.count > 0) {
		await insertExerciseMuscleGroups(tx, exerciseId, exercise.global.muscleGroups);
	}

	return exerciseId;
}

async function findOrCreateExerciseId(
	tx: Tx,
	userId: string,
	exercise: PreparedWorkoutWriteExercise,
): Promise<string> {
	if (exercise.exerciseId) {
		const submittedExerciseId = await findSubmittedExerciseId(
			tx,
			userId,
			exercise.exerciseId,
			exercise.global.normalizedName,
		);

		if (submittedExerciseId) {
			return submittedExerciseId;
		}
	}

	const existingExerciseId = await findExerciseIdByNormalizedName(
		tx,
		userId,
		exercise.global.normalizedName,
	);

	return existingExerciseId ?? createOrGetExercise(tx, userId, exercise);
}

export async function findOrCreateWorkoutExercises(
	tx: Tx,
	userId: string,
	exercisesForWorkout: PreparedWorkoutWriteExercise[],
): Promise<WorkoutExerciseWithDatabaseId[]> {
	// Duplicates by name still resolve to the same row: createOrGetExercise handles insert conflicts.
	const exercisesWithDatabaseIds = await Promise.all(
		exercisesForWorkout.map(async (exercise) => ({
			...exercise,
			exerciseId: await findOrCreateExerciseId(tx, userId, exercise),
		})),
	);

	return exercisesWithDatabaseIds;
}
