"use client";

import { useMemo } from "react";
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
			staleTime: 60_000,
		}),
	);

	const exercises = useMemo(() => {
		const fromDefaults = DEFAULT_EXERCISES.filter((exercise) =>
			exercise.muscleGroups.some((muscleName) => getCategoryForMuscleName(muscleName) === category),
		).map(createSuggestionObject);

		const fromDb = categoryQuery.data ?? [];

		return sortExercisesAlphabetically(deduplicateExercises(fromDefaults, fromDb));
	}, [category, categoryQuery.data]);

	return {
		exercises,
		isLoading: categoryQuery.isLoading,
	};
}
