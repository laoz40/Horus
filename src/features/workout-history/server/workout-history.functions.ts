import "server-only";

import { Data, Effect } from "effect";
import type {
	ListWorkoutsQuery,
	WorkoutHistoryRow,
} from "@/features/workout-history/server/workout-history.db";

class NoWorkoutsError extends Data.TaggedError("NO_WORKOUTS") {}

export function requireDeletedWorkouts(result: { deletedCount: number }) {
	if (result.deletedCount === 0) {
		return Effect.fail(new NoWorkoutsError());
	}

	return Effect.succeed(result);
}

export function buildWorkoutHistoryPage(rows: WorkoutHistoryRow[], query: ListWorkoutsQuery) {
	const pageWorkouts = rows.slice(0, query.limit);

	return {
		items: pageWorkouts.map((workout) => ({
			id: workout.id,
			createdAt: workout.createdAt.getTime(),
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
