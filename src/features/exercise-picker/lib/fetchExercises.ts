import { createSuggestionObject } from "@/features/exercise-picker/lib/convertExerciseData";
import { DEFAULT_EXERCISES } from "@/features/exercise-picker/lib/defaultExercises";
import { normalizeName } from "@/lib/normalizeName";

export const fetchDefaultExercises = (query: string) => {
	const matchedDefaultExercises = DEFAULT_EXERCISES.filter((exercise) =>
		normalizeName(exercise.name).includes(normalizeName(query)),
	);

	return matchedDefaultExercises.map(createSuggestionObject);
};
