import { createSuggestionObject } from "@/features/workout-form/lib/convertWorkoutData";
import { DEFAULT_EXERCISES } from "@/features/workout-form/lib/defaultExercises";
import { normalizeName } from "@/lib/normalizeName";

export const fetchDefaultExercises = (query: string) => {
	const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
		normalizeName(exercise.name).includes(normalizeName(query)),
	);

	return matchedDefaultExercises.map(createSuggestionObject);
};
