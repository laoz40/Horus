import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { findUserExerciseIdByNormalizedName } from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import { getOrCreateMuscleGroupId } from "@/server/exercises/library/library.db";

type Tx = DatabaseTransaction;

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

export type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

export type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

export async function findOrCreateWorkoutExercises(
	tx: Tx,
	userId: string,
	exercisesForWorkout: PreparedWorkoutWriteExercise[],
): Promise<WorkoutExerciseWithDatabaseId[]> {
	// Duplicates by name still resolve to the same row: the insert handles conflicts.
	return Promise.all(
		exercisesForWorkout.map(async (exercise) => {
			// Names are unique per user, so a matching submitted ID resolves to this same row.
			const [existing] = await tx.$queryRawTyped(
				findUserExerciseIdByNormalizedName(userId, exercise.global.normalizedName),
			);

			if (existing) {
				return { ...exercise, exerciseId: existing.id };
			}

			const created = await tx.exercises.createMany({
				data: [
					{
						user_id: userId,
						name: exercise.global.name,
						normalized_name: exercise.global.normalizedName,
					},
				],
				skipDuplicates: true,
			});

			const [resolved] = await tx.$queryRawTyped(
				findUserExerciseIdByNormalizedName(userId, exercise.global.normalizedName),
			);

			if (!resolved) throw new Error("Exercise conflict did not resolve to an existing row");

			if (created.count > 0) {
				const muscleGroupIds = await Promise.all(
					exercise.global.muscleGroups.map((muscleGroup) =>
						getOrCreateMuscleGroupId(tx, muscleGroup),
					),
				);

				await tx.exercise_muscle_groups.createMany({
					data: muscleGroupIds.map((id) => ({ exercise_id: resolved.id, muscle_group_id: id })),
					skipDuplicates: true,
				});
			}

			return { ...exercise, exerciseId: resolved.id };
		}),
	);
}
