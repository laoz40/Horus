import "server-only";

import { Data, Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { normalizeName } from "@/lib/normalizeName";
import { normalizeMuscleGroups } from "@/lib/normalizeMuscleGroups";
import type { WorkoutExerciseWithDatabaseId } from "@/server/exercises/library/workout-exercises.db";

class InvalidWorkoutInputError extends Data.TaggedError("INVALID_INPUT") {}

export function validateUniqueWorkoutChildIds(workout: WorkoutForSave) {
	const workoutExerciseIds = workout.exercises.map((exercise) => exercise.id);
	const setIds = workout.exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));

	const hasDuplicateWorkoutExerciseId =
		new Set(workoutExerciseIds).size !== workoutExerciseIds.length;

	const hasDuplicateSetId = new Set(setIds).size !== setIds.length;

	if (hasDuplicateWorkoutExerciseId || hasDuplicateSetId) {
		return Effect.fail(new InvalidWorkoutInputError());
	}

	return Effect.succeed(null);
}

export function normalizeWorkoutForWrite(workout: WorkoutForSave) {
	return {
		...workout,
		exercises: workout.exercises.map((exercise) => ({
			...exercise,
			global: {
				name: exercise.global.name,
				normalizedName: normalizeName(exercise.global.name),
				muscleGroups: normalizeMuscleGroups(exercise.global.muscleGroups),
			},
		})),
	};
}

export function buildNewWorkoutPrSets(
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
) {
	return exercisesForWorkout.flatMap((exercise) =>
		exercise.sets.map((set) => ({
			setId: set.id,
			workoutId,
			exerciseId: exercise.exerciseId,
			weight: set.weight,
			reps: set.reps,
			completed: set.completed,
		})),
	);
}
