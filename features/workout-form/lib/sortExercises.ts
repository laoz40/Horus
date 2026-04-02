import { ExerciseSuggestion } from "@/features/workout-form/hooks/useExerciseSuggestions";

export const sortExercisesAlphabetically = (
	exercises: ExerciseSuggestion[],
) => {
	return [...exercises].sort((leftExercise, rightExercise) =>
		leftExercise.name.localeCompare(rightExercise.name, undefined, {
			sensitivity: "base",
		}),
	);
};
