import type { ExerciseSuggestion } from "@/features/workout-form/lib/convertWorkoutData";

export const sortExercisesAlphabetically = (exercises: ExerciseSuggestion[]) => {
	return exercises.toSorted((leftExercise, rightExercise) =>
		leftExercise.name.localeCompare(rightExercise.name, undefined, {
			sensitivity: "base",
		}),
	);
};
