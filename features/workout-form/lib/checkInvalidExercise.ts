import type { FieldErrors } from "react-hook-form";

import type { Workout } from "./validateWorkout";

type ExerciseErrorShape = {
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

const exerciseHasValidationError = (exerciseError: unknown): boolean => {
	if (!exerciseError || typeof exerciseError !== "object") {
		return false;
	}

	const error = exerciseError as ExerciseErrorShape;

	if (error.global?.name) return true;
	if (error.sets?.message || error.sets?.root?.message) return true;
	// check each set for errors
	if (Array.isArray(error.sets)) return error.sets.some((set) => Boolean(set?.reps));

	// if none of the above returns true, exercise is valid
	return false;
};

export const getFirstInvalidExerciseIndex = (errors: FieldErrors<Workout>): number | null => {
	const exerciseErrors = errors.exercises;
	if (!Array.isArray(exerciseErrors)) return null;

	// loop through the errors and find the first one that is an exercise error
	for (const [exerciseIndex, exerciseError] of exerciseErrors.entries()) {
		if (exerciseHasValidationError(exerciseError)) {
			return exerciseIndex;
		}
	}

	return null;
};
