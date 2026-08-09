import "server-only";

import {
	getWorkoutForEdit,
	listWorkoutRows,
	type ListWorkoutsQuery,
} from "@/server/services/workouts.db";
import {
	buildWorkoutEditForm,
	buildWorkoutHistoryPage,
	requireWorkoutForEdit,
} from "@/server/services/workouts.functions";

export function getWorkoutById(workoutId: string, userId: string) {
	return getWorkoutForEdit(workoutId, userId)
		.andThen(requireWorkoutForEdit)
		.map(buildWorkoutEditForm);
}

export function listWorkouts(query: ListWorkoutsQuery) {
	return listWorkoutRows(query).map((rows) => buildWorkoutHistoryPage(rows, query));
}
