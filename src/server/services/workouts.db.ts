import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getWorkoutDetails,
	getWorkoutExerciseIds as getWorkoutExerciseIdsQuery,
	getWorkoutExerciseRows,
	getWorkoutForUpdate,
	getWorkoutSetRows,
	listWorkoutHistory,
} from "@/generated/prisma/sql";
import { prisma, type DatabaseTransaction } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";
import type {
	PreparedWorkoutWriteExercise,
	WorkoutExerciseWithDatabaseId,
} from "@/server/services/exercises.db";
import type { PrSetUpdate } from "@/server/services/pr-history.functions";

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

export type ListWorkoutsQuery = {
	userId: string;
	limit: number;
	offset: number;
};

export type WorkoutForEdit = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	exercises: Array<{
		id: string;
		exerciseId: string;
		name: string;
		muscleGroups: string[];
		difficulty: number | null;
		notes: string;
		sets: Array<{
			id: string;
			weight: number;
			reps: number;
			completed: boolean;
			isWeightPr: boolean;
			isVolumePr: boolean;
			isBodyweightRepsPr: boolean;
		}>;
	}>;
};

export type WorkoutHistoryRow = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	totalPrSets: number;
	exerciseCount: number;
	totalVolume: number;
	muscleGroups: string[];
};

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

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

export function deleteAllWorkoutRows(userId: string) {
	return tryPromise({
		try: async () => {
			const deletedWorkouts = await prisma.workouts.deleteMany({
				where: { user_id: userId },
			});

			return { deletedCount: deletedWorkouts.count };
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getWorkoutForEdit(workoutId: string, userId: string) {
	return tryPromise({
		try: async (): Promise<WorkoutForEdit | null> => {
			const [workoutRows, exerciseRows, setRows] = await Promise.all([
				prisma.$queryRawTyped(getWorkoutDetails(workoutId, userId)),
				prisma.$queryRawTyped(getWorkoutExerciseRows(workoutId)),
				prisma.$queryRawTyped(getWorkoutSetRows(workoutId)),
			]);

			const workout = workoutRows[0];

			if (!workout) {
				return null;
			}

			return {
				id: workout.id,
				createdAt: workout.created_at,
				name: workout.name,
				durationSeconds: workout.duration_seconds,
				exercises: exerciseRows.map((exercise) => ({
					id: exercise.id,
					exerciseId: exercise.exercise_id,
					name: exercise.name,
					muscleGroups: exercise.muscle_groups ?? [],
					difficulty: exercise.difficulty ? decimalToNumber(exercise.difficulty) : null,
					notes: exercise.notes,
					sets: setRows
						.filter((set) => set.workout_exercise_id === exercise.id)
						.map((set) => ({
							id: set.id,
							weight: decimalToNumber(set.weight),
							reps: decimalToNumber(set.reps),
							completed: set.completed,
							isWeightPr: set.is_weight_pr,
							isVolumePr: set.is_volume_pr,
							isBodyweightRepsPr: set.is_bodyweight_reps_pr,
						})),
				})),
			};
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function listWorkoutRows(query: ListWorkoutsQuery) {
	return tryPromise({
		try: async (): Promise<WorkoutHistoryRow[]> => {
			const rows = await prisma.$queryRawTyped(
				listWorkoutHistory(query.userId, query.limit + 1, query.offset),
			);

			return rows.map((row) => ({
				id: row.id,
				createdAt: row.created_at,
				name: row.name,
				durationSeconds: row.duration_seconds,
				totalPrSets: row.total_pr_sets,
				exerciseCount: row.exercise_count ?? 0,
				totalVolume: row.total_volume ?? 0,
				muscleGroups: row.muscle_groups ?? [],
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
