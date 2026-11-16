import type { QueryClient } from "@tanstack/react-query";

import type { ExerciseCatalogItem } from "@/features/exercise-library/lib/exerciseEditor";
import { orpc } from "@/lib/orpc/client";

type ExerciseListData = {
	exercises: ExerciseCatalogItem[];
};

function sortExercisesByName(exercises: ExerciseCatalogItem[]) {
	return exercises.toSorted((left, right) => left.name.localeCompare(right.name));
}

function updateExerciseListCache(
	queryClient: QueryClient,
	update: (exercises: ExerciseCatalogItem[]) => ExerciseCatalogItem[],
) {
	queryClient.setQueryData<ExerciseListData>(orpc.exercises.list.queryKey(), (current) => {
		if (!current) {
			return current;
		}

		return { exercises: sortExercisesByName(update(current.exercises)) };
	});
}

export function patchExerciseListCache(queryClient: QueryClient, exercise: ExerciseCatalogItem) {
	updateExerciseListCache(queryClient, (exercises) =>
		exercises.map((currentExercise) => {
			if (currentExercise.id !== exercise.id) {
				return currentExercise;
			}

			return { ...exercise, workoutCount: currentExercise.workoutCount };
		}),
	);
}

export function addExerciseToListCache(queryClient: QueryClient, exercise: ExerciseCatalogItem) {
	updateExerciseListCache(queryClient, (exercises) => {
		if (exercises.some((currentExercise) => currentExercise.id === exercise.id)) {
			return exercises.map((currentExercise) => {
				if (currentExercise.id !== exercise.id) {
					return currentExercise;
				}

				return exercise;
			});
		}

		return [...exercises, exercise];
	});
}

export function removeExerciseFromListCache(queryClient: QueryClient, exerciseId: string) {
	updateExerciseListCache(queryClient, (exercises) =>
		exercises.filter((exercise) => exercise.id !== exerciseId),
	);
}

export function mergeExercisesInListCache(
	queryClient: QueryClient,
	sourceId: string,
	targetExercise: ExerciseCatalogItem,
) {
	updateExerciseListCache(queryClient, (exercises) => {
		const sourceExercise = exercises.find((exercise) => exercise.id === sourceId);

		return exercises
			.filter((exercise) => exercise.id !== sourceId)
			.map((exercise) => {
				if (exercise.id !== targetExercise.id) {
					return exercise;
				}

				return {
					...targetExercise,
					workoutCount: exercise.workoutCount + (sourceExercise?.workoutCount ?? 0),
				};
			});
	});
}
