import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getWorkoutForEdit,
	listWorkoutRows,
	updateWorkoutRows,
	type ListWorkoutsQuery,
} from "@/server/services/workouts.db";
import {
	buildWorkoutEditForm,
	buildWorkoutHistoryPage,
	normalizeWorkoutForUpdate,
	requireWorkoutForEdit,
	requireWorkoutForUpdate,
	validateUniqueWorkoutChildIds,
} from "@/server/services/workouts.functions";

export function getWorkoutById(workoutId: string, userId: string) {
	return getWorkoutForEdit(workoutId, userId)
		.andThen(requireWorkoutForEdit)
		.map(buildWorkoutEditForm);
}

export function listWorkouts(query: ListWorkoutsQuery) {
	return listWorkoutRows(query).map((rows) => buildWorkoutHistoryPage(rows, query));
}

export function updateWorkout(workoutId: string, userId: string, workout: WorkoutForSave) {
	return validateUniqueWorkoutChildIds(workout)
		.map(() => ({
			workoutId,
			userId,
			workout: normalizeWorkoutForUpdate(workout),
		}))
		.asyncAndThen((updateInput) => updateWorkoutRows(updateInput, requireWorkoutForUpdate))
		.map(() => ({ workoutId, workout }));
}
