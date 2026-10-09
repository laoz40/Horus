import "server-only";

import type { WorkoutUpdateInput } from "@/server/workouts/workouts.db";
import { deleteWorkoutExercises } from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import type { PrSetUpdate } from "@/server/exercises/pr-history/pr-history.functions";
import type { WorkoutExerciseWithDatabaseId } from "@/server/exercises/library/workout-exercises.repository";

type Tx = DatabaseTransaction;

export async function updateWorkoutFields(tx: Tx, updateInput: WorkoutUpdateInput): Promise<void> {
	await tx.workouts.updateMany({
		where: {
			id: updateInput.workoutId,
			user_id: updateInput.userId,
		},
		data: {
			name: updateInput.workout.name,
			duration_seconds: updateInput.workout.durationSeconds,
			total_pr_sets: 0,
		},
	});
}

export async function deleteWorkoutChildren(tx: Tx, workoutId: string): Promise<void> {
	await tx.$queryRawTyped(deleteWorkoutExercises(workoutId));
}

export async function insertWorkoutExerciseRows(
	tx: Tx,
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
): Promise<void> {
	await tx.workout_exercises.createMany({
		data: exercisesForWorkout.map((exercise, position) => ({
			id: exercise.id,
			workout_id: workoutId,
			exercise_id: exercise.exerciseId,
			position,
			difficulty: exercise.difficulty,
			notes: exercise.notes ?? "",
		})),
	});
}

export async function insertWorkoutSetRows(
	tx: Tx,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
	prStatusesBySetId: ReadonlyMap<string, PrSetUpdate> = new Map(),
): Promise<void> {
	await tx.workout_sets.createMany({
		data: exercisesForWorkout.flatMap((exercise) =>
			exercise.sets.map((set, position) => {
				const prStatus = prStatusesBySetId.get(set.id);

				return {
					id: set.id,
					workout_exercise_id: exercise.id,
					position,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
					is_weight_pr: prStatus?.isWeightPr ?? false,
					is_volume_pr: prStatus?.isVolumePr ?? false,
					is_bodyweight_reps_pr: prStatus?.isBodyweightRepsPr ?? false,
				};
			}),
		),
	});
}
