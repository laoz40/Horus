import type { FieldErrors } from "react-hook-form";

import type { Workout } from "@/features/workout-form/lib/validateWorkout";

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
		// RHF's exercise errors bottom out in `any`; downgrade to unknown, then narrow to a non-null object
		const error: unknown = exerciseError;
		if (!(error instanceof Object)) continue;
		if (exerciseHasValidationError(error)) return exerciseIndex;
	}

	return null;
};
