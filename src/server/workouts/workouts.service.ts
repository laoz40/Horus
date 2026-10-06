import "server-only";

import type { ResultAsync } from "neverthrow";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { runDatabaseTransaction } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";
import { findOrCreateWorkoutExercises } from "@/server/exercises/library/workout-exercises.repository";
import {
	deleteWorkoutById,
	deleteAllWorkoutRows,
	deleteWorkoutChildren,
	getWorkout,
	getWorkoutExerciseIds,
	getWorkoutForEdit,
	insertWorkoutExerciseRows,
	insertWorkoutRow,
	insertWorkoutSetRows,
	listWorkoutRows,
	updateWorkoutFields,
	updateWorkoutPrTotal,
	type ListWorkoutsQuery,
	type WorkoutUpdateInput,
	type WorkoutWriteInput,
} from "@/server/workouts/workouts.repository";
import {
	calculateSetPrsFromHistory,
	recalculateExercisePrHistory,
} from "@/server/exercises/pr-history/pr-history.service";
import {
	buildAffectedExerciseIds,
	buildPrTotalsByWorkoutId,
} from "@/server/exercises/pr-history/pr-history.functions";
import {
	buildNewWorkoutPrSets,
	buildWorkoutEditForm,
	buildWorkoutHistoryPage,
	normalizeWorkoutForWrite,
	requireDeletedWorkouts,
	requireWorkout,
	validateUniqueWorkoutChildIds,
} from "@/server/workouts/workouts.functions";

export function createWorkout(createInput: WorkoutWriteInput) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx): Promise<string> => {
				const workoutId = await insertWorkoutRow(tx, createInput);

				const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(
					tx,
					createInput.userId,
					createInput.workout.exercises,
				);

				const newWorkoutSets = buildNewWorkoutPrSets(workoutId, exercisesWithDatabaseIds);
				const prStatuses = await calculateSetPrsFromHistory(tx, createInput.userId, newWorkoutSets);
				const prStatusesBySetId = new Map(prStatuses.map((status) => [status.setId, status]));
				const totalPrSets = buildPrTotalsByWorkoutId(prStatuses).get(workoutId) ?? 0;

				await insertWorkoutExerciseRows(tx, workoutId, exercisesWithDatabaseIds);
				await insertWorkoutSetRows(tx, exercisesWithDatabaseIds, prStatusesBySetId);
				await updateWorkoutPrTotal(tx, workoutId, totalPrSets);

				return workoutId;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

function updateWorkoutAndRecalculatePrs(
	updateInput: WorkoutUpdateInput,
): ResultAsync<string | null, { reason: "DATABASE_ERROR"; cause: unknown }> {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx): Promise<string | null> => {
				const workout = await getWorkout(tx, updateInput.workoutId, updateInput.userId);

				if (!workout) {
					return null;
				}

				const previousExerciseIds = await getWorkoutExerciseIds(tx, updateInput.workoutId);

				const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(
					tx,
					updateInput.userId,
					updateInput.workout.exercises,
				);

				const affectedExerciseIds = buildAffectedExerciseIds(
					previousExerciseIds,
					exercisesWithDatabaseIds.map((exercise) => exercise.exerciseId),
				);

				await updateWorkoutFields(tx, updateInput);
				await deleteWorkoutChildren(tx, updateInput.workoutId);
				await insertWorkoutExerciseRows(tx, updateInput.workoutId, exercisesWithDatabaseIds);
				await insertWorkoutSetRows(tx, exercisesWithDatabaseIds);
				await recalculateExercisePrHistory(tx, updateInput.userId, affectedExerciseIds, {
					workoutId: workout.id,
					createdAt: workout.createdAt,
				});

				return workout.id;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

function deleteWorkoutAndRecalculatePrs(workoutId: string, userId: string) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx) => {
				const workout = await getWorkout(tx, workoutId, userId);

				if (!workout) {
					return null;
				}

				const exerciseIds = await getWorkoutExerciseIds(tx, workoutId);
				await deleteWorkoutById(tx, workoutId, userId);
				await recalculateExercisePrHistory(tx, userId, exerciseIds, {
					workoutId: workout.id,
					createdAt: workout.createdAt,
				});

				return { id: workout.id, name: workout.name };
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getWorkoutById(workoutId: string, userId: string) {
	return getWorkoutForEdit(workoutId, userId).andThen(requireWorkout).map(buildWorkoutEditForm);
}

export function listWorkouts(query: ListWorkoutsQuery) {
	return listWorkoutRows(query).map((rows) => buildWorkoutHistoryPage(rows, query));
}

export function deleteWorkout(workoutId: string, userId: string) {
	return deleteWorkoutAndRecalculatePrs(workoutId, userId).andThen(requireWorkout);
}

export function deleteAllWorkouts(userId: string) {
	return deleteAllWorkoutRows(userId).andThen(requireDeletedWorkouts);
}

export function validateAndNormalizeWorkout(workout: WorkoutForSave) {
	return validateUniqueWorkoutChildIds(workout).map(() => normalizeWorkoutForWrite(workout));
}

export function updateWorkout(updateInput: WorkoutUpdateInput) {
	return updateWorkoutAndRecalculatePrs(updateInput).andThen(requireWorkout);
}
