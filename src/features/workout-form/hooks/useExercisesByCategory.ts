"use client";

import { useQuery } from "@tanstack/react-query";

import {
	createSuggestionObject,
	deduplicateExercises,
} from "@/features/workout-form/lib/convertWorkoutData";
import { DEFAULT_EXERCISES } from "@/features/workout-form/lib/defaultExercises";
import {
	getCategoryForMuscleName,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { sortExercisesAlphabetically } from "@/features/workout-form/lib/sortExercises";
import { orpc } from "@/lib/orpc/client";

export function useExercisesByCategory(category: MuscleGroupCategory) {
	const categoryQuery = useQuery(
		orpc.exercises.listByCategory.queryOptions({
			input: { category },
			// Exercises only change via settings or after saving a workout; neither happens mid-form.
			staleTime: Number.POSITIVE_INFINITY,
		}),
	);

	const fromDefaults = DEFAULT_EXERCISES.filter((exercise) =>
		exercise.muscleGroups.some((muscleName) => getCategoryForMuscleName(muscleName) === category),
	).map(createSuggestionObject);

	const fromDb = categoryQuery.data ?? [];
	const exercises = sortExercisesAlphabetically(deduplicateExercises(fromDefaults, fromDb));

	return {
		exercises,
		isLoading: categoryQuery.isLoading,
		isFetching: categoryQuery.isFetching,
	};
}
