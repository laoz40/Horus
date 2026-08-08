import "server-only";

import type { ListWorkoutsQuery, WorkoutHistoryRow } from "@/server/services/workouts.db";

export function buildWorkoutHistoryPage(rows: WorkoutHistoryRow[], query: ListWorkoutsQuery) {
	const pageWorkouts = rows.slice(0, query.limit);

	return {
		items: pageWorkouts.map((workout) => ({
			_id: workout.id,
			_creationTime: workout.createdAt.getTime(),
			name: workout.name,
			durationSeconds: workout.durationSeconds,
			totalVolume: workout.totalVolume,
			totalPrSets: workout.totalPrSets,
			exerciseCount: workout.exerciseCount,
			muscleGroups: workout.muscleGroups,
		})),
		// If an extra row exists, another page is available.
		nextOffset: rows.length > query.limit ? query.offset + query.limit : null,
	};
}
