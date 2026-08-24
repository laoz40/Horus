import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	createWorkoutRows,
	deleteWorkoutRow,
	getWorkoutForEdit,
	listWorkoutRows,
	updateWorkoutRows,
	type ListWorkoutsQuery,
} from "@/server/services/workouts.db";
import {
	buildWorkoutEditForm,
	buildWorkoutHistoryPage,
	normalizeWorkoutForWrite,
	requireWorkout,
	requireWorkoutForUpdate,
	validateUniqueWorkoutChildIds,
} from "@/server/services/workouts.functions";

export function getWorkoutById(workoutId: string, userId: string) {
	return getWorkoutForEdit(workoutId, userId).andThen(requireWorkout).map(buildWorkoutEditForm);
}

export function listWorkouts(query: ListWorkoutsQuery) {
	return listWorkoutRows(query).map((rows) => buildWorkoutHistoryPage(rows, query));
}

export function deleteWorkout(workoutId: string, userId: string) {
	return deleteWorkoutRow(workoutId, userId).andThen(requireWorkout);
}

export function createWorkout(userId: string, workout: WorkoutForSave) {
	return validateUniqueWorkoutChildIds(workout)
		.map(() => ({
			userId,
			workout: normalizeWorkoutForWrite(workout),
		}))
		.asyncAndThen(createWorkoutRows)
		.map((workoutId) => ({ workoutId, workout }));
}

export function updateWorkout(workoutId: string, userId: string, workout: WorkoutForSave) {
	return validateUniqueWorkoutChildIds(workout)
		.map(() => ({
			workoutId,
			userId,
			workout: normalizeWorkoutForWrite(workout),
		}))
		.asyncAndThen((updateInput) => updateWorkoutRows(updateInput, requireWorkoutForUpdate))
		.map(() => ({ workoutId, workout }));
}
