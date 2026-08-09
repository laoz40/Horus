import "server-only";

import { err, ok } from "neverthrow";

import type {
	ListWorkoutsQuery,
	WorkoutForEdit,
	WorkoutHistoryRow,
} from "@/server/services/workouts.db";

export function requireWorkoutForEdit(workout: WorkoutForEdit | null) {
	if (workout === null) {
		return err({ reason: "NOT_FOUND" as const });
	}

	return ok(workout);
}

export function buildWorkoutEditForm(workout: WorkoutForEdit) {
	return {
		name: workout.name,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			global: {
				name: exercise.name,
				muscleGroups: exercise.muscleGroups,
			},
			difficulty: exercise.difficulty ?? undefined,
			notes: exercise.notes || undefined,
			sets: exercise.sets,
		})),
	};
}

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
