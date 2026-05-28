import type { ExerciseSuggestion } from "@/features/workout-form/lib/types";

export const sortExercisesAlphabetically = (
	exercises: ExerciseSuggestion[],
) => {
	return [...exercises].sort((leftExercise, rightExercise) =>
		leftExercise.name.localeCompare(rightExercise.name, undefined, {
			sensitivity: "base",
		}),
	);
};
