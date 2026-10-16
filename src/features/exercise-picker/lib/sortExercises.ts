import type { ExerciseSuggestion } from "@/features/exercise-picker/lib/convertExerciseData";

export const sortExercisesAlphabetically = (exercises: ExerciseSuggestion[]) => {
	return exercises.toSorted((leftExercise, rightExercise) =>
		leftExercise.name.localeCompare(rightExercise.name, undefined, {
			sensitivity: "base",
		}),
	);
};
