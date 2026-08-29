import type { FieldErrors } from "react-hook-form";

import type { Workout } from "./validateWorkout";

type ExerciseFieldErrors = {
	global?: {
		name?: unknown;
	};
	sets?: Array<{
		reps?: unknown;
	}> & {
		message?: unknown;
		root?: {
			message?: unknown;
		};
	};
};

const exerciseHasValidationError = (error: ExerciseFieldErrors): boolean => {
	if (error.global?.name) return true;

	const sets = error.sets;
	if (sets?.message || sets?.root?.message) return true;
	return Array.isArray(sets) && sets.some((set) => Boolean(set?.reps));
};

export const getFirstInvalidExerciseIndex = (errors: FieldErrors<Workout>): number | null => {
	const exerciseErrors = errors.exercises;
	if (!Array.isArray(exerciseErrors)) return null;

	// loop through the errors and find the first one that is an exercise error
	for (const [exerciseIndex, exerciseError] of exerciseErrors.entries()) {
		const error: unknown = exerciseError;
		if (!error || typeof error !== "object") continue;

		if (exerciseHasValidationError(error)) return exerciseIndex;
	}

	return null;
};
