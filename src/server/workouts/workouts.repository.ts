import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getWorkoutExerciseIds as getWorkoutExerciseIdsQuery,
	getWorkoutForUpdate,
} from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import type { PrSetUpdate } from "@/server/exercises/pr-history/pr-history.functions";
import type {
	PreparedWorkoutWriteExercise,
	WorkoutExerciseWithDatabaseId,
} from "@/server/exercises/library/workout-exercises.repository";

type Tx = DatabaseTransaction;

export type WorkoutWriteInput = {
	userId: string;
	workout: Omit<WorkoutForSave, "exercises"> & {
		exercises: PreparedWorkoutWriteExercise[];
	};
};

export type WorkoutUpdateInput = WorkoutWriteInput & {
	workoutId: string;
};

export async function getWorkout(tx: Tx, workoutId: string, userId: string) {
	const [workout] = await tx.$queryRawTyped(getWorkoutForUpdate(workoutId, userId));

	if (!workout) {
		return undefined;
	}

	return {
		id: workout.id,
		name: workout.name,
		createdAt: workout.created_at,
	};
}

export async function getWorkoutExerciseIds(tx: Tx, workoutId: string): Promise<string[]> {
	const rows = await tx.$queryRawTyped(getWorkoutExerciseIdsQuery(workoutId));

	return rows.map((row) => row.exercise_id);
}

export async function insertWorkoutRow(tx: Tx, writeInput: WorkoutWriteInput): Promise<string> {
	const workout = await tx.workouts.create({
		data: {
			user_id: writeInput.userId,
			name: writeInput.workout.name,
			duration_seconds: writeInput.workout.durationSeconds,
		},
		select: { id: true },
	});

	return workout.id;
}

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
	await tx.workout_exercises.deleteMany({
		where: { workout_id: workoutId },
	});
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

export async function updateWorkoutPrTotal(
	tx: Tx,
	workoutId: string,
	totalPrSets: number,
): Promise<void> {
	await tx.workouts.update({
		where: { id: workoutId },
		data: { total_pr_sets: totalPrSets },
	});
}

export async function deleteWorkoutById(tx: Tx, workoutId: string, userId: string): Promise<void> {
	await tx.workouts.deleteMany({
		where: {
			id: workoutId,
			user_id: userId,
		},
	});
}
