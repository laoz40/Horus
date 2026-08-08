import "server-only";

import { listWorkoutRows, type ListWorkoutsQuery } from "@/server/services/workouts.db";
import { buildWorkoutHistoryPage } from "@/server/services/workouts.functions";

export function listWorkouts(query: ListWorkoutsQuery) {
	return listWorkoutRows(query).map((rows) => buildWorkoutHistoryPage(rows, query));
}
