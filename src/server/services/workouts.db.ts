import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import { and, eq } from "drizzle-orm";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getWorkoutDetails,
	getWorkoutExerciseRows,
	getWorkoutSetRows,
	listWorkoutHistory,
} from "@/generated/prisma/sql";
import { db, prisma, type DatabaseTransaction } from "@/lib/db";
import { workoutExercises, workouts, workoutSets } from "@/lib/db/schema";
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

export function getWorkout(tx: Tx, workoutId: string, userId: string) {
	return tx
		.select({ id: workouts.id, name: workouts.name, createdAt: workouts.createdAt })
		.from(workouts)
		.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
		.limit(1)
		.for("update")
		.then(([workout]) => workout);
}

export function getWorkoutExerciseIds(tx: Tx, workoutId: string): Promise<string[]> {
	return tx
		.selectDistinct({ exerciseId: workoutExercises.exerciseId })
		.from(workoutExercises)
		.where(eq(workoutExercises.workoutId, workoutId))
		.then((rows) => rows.map((row) => row.exerciseId));
}

export async function insertWorkoutRow(tx: Tx, writeInput: WorkoutWriteInput): Promise<string> {
	const [workout] = await tx
		.insert(workouts)
		.values({
			userId: writeInput.userId,
			name: writeInput.workout.name,
			durationSeconds: writeInput.workout.durationSeconds,
		})
		.returning({ id: workouts.id });

	if (!workout) {
		throw new Error("Workout insert did not return a row");
	}

	return workout.id;
}

export async function updateWorkoutFields(tx: Tx, updateInput: WorkoutUpdateInput): Promise<void> {
	await tx
		.update(workouts)
		.set({
			name: updateInput.workout.name,
			durationSeconds: updateInput.workout.durationSeconds,
			totalPrSets: 0,
		})
		.where(and(eq(workouts.id, updateInput.workoutId), eq(workouts.userId, updateInput.userId)));
}

export async function deleteWorkoutChildren(tx: Tx, workoutId: string): Promise<void> {
	await tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));
}

export async function insertWorkoutExerciseRows(
	tx: Tx,
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
): Promise<void> {
	await tx.insert(workoutExercises).values(
		exercisesForWorkout.map((exercise, position) => ({
			id: exercise.id,
			workoutId,
			exerciseId: exercise.exerciseId,
			position,
			difficulty: exercise.difficulty,
			notes: exercise.notes ?? "",
		})),
	);
}

export async function insertWorkoutSetRows(
	tx: Tx,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
	prStatusesBySetId: ReadonlyMap<string, PrSetUpdate> = new Map(),
): Promise<void> {
	await tx.insert(workoutSets).values(
		exercisesForWorkout.flatMap((exercise) =>
			exercise.sets.map((set, position) => {
				const prStatus = prStatusesBySetId.get(set.id);

				return {
					id: set.id,
					workoutExerciseId: exercise.id,
					position,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
					isWeightPr: prStatus?.isWeightPr ?? false,
					isVolumePr: prStatus?.isVolumePr ?? false,
					isBodyweightRepsPr: prStatus?.isBodyweightRepsPr ?? false,
				};
			}),
		),
	);
}

export async function updateWorkoutPrTotal(
	tx: Tx,
	workoutId: string,
	totalPrSets: number,
): Promise<void> {
	await tx.update(workouts).set({ totalPrSets }).where(eq(workouts.id, workoutId));
}

export async function deleteWorkoutById(tx: Tx, workoutId: string, userId: string): Promise<void> {
	await tx.delete(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}

export function deleteAllWorkoutRows(userId: string) {
	return tryPromise({
		try: async () => {
			const deletedWorkouts = await db
				.delete(workouts)
				.where(eq(workouts.userId, userId))
				.returning({ id: workouts.id });

			return { deletedCount: deletedWorkouts.length };
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
