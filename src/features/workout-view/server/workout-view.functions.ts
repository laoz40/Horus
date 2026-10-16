import "server-only";

import { Data, Effect } from "effect";

import type { WorkoutForEdit } from "@/features/workout-form/server/workouts.db";
import { buildSetPrTypes } from "@/features/personal-records/lib/setPr";

class WorkoutNotFoundError extends Data.TaggedError("NOT_FOUND") {}

export function requireWorkout<T>(workout: T | null) {
	if (workout === null) {
		return Effect.fail(new WorkoutNotFoundError());
	}

	return Effect.succeed(workout);
}

export function buildWorkoutEditForm(workout: WorkoutForEdit) {
	return {
		name: workout.name,
		createdAt: workout.createdAt.getTime(),
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			exerciseId: exercise.exerciseId,
			global: {
				name: exercise.name,
				muscleGroups: exercise.muscleGroups,
			},
			difficulty: exercise.difficulty ?? undefined,
			notes: exercise.notes || undefined,
			sets: exercise.sets.map((set) => ({
				id: set.id,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
				prTypes: buildSetPrTypes(set),
			})),
		})),
	};
}
