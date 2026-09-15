import type { QueryClient } from "@tanstack/react-query";

import type { ExerciseCatalogItem } from "@/features/settings/lib/exerciseEditSheet";
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
		exercises.map((currentExercise) =>
			currentExercise.id === exercise.id
				? { ...exercise, workoutCount: currentExercise.workoutCount }
				: currentExercise,
		),
	);
}

export function addExerciseToListCache(queryClient: QueryClient, exercise: ExerciseCatalogItem) {
	updateExerciseListCache(queryClient, (exercises) => {
		if (exercises.some((currentExercise) => currentExercise.id === exercise.id)) {
			return exercises.map((currentExercise) =>
				currentExercise.id === exercise.id ? exercise : currentExercise,
			);
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
			.map((exercise) =>
				exercise.id === targetExercise.id
					? {
							...targetExercise,
							workoutCount: exercise.workoutCount + (sourceExercise?.workoutCount ?? 0),
						}
					: exercise,
			);
	});
}

function exerciseQueryIsInUse(queryClient: QueryClient, queryKey: readonly unknown[]) {
	return queryClient
		.getQueryCache()
		.findAll({ queryKey })
		.some((query) => query.getObserversCount() > 0);
}

export function invalidateExerciseQueriesInBackground(queryClient: QueryClient) {
	const invalidations = [
		queryClient.invalidateQueries({
			queryKey: orpc.exercises.list.key(),
		}),
	];

	if (exerciseQueryIsInUse(queryClient, orpc.exercises.listByCategory.key())) {
		invalidations.push(
			queryClient.invalidateQueries({
				queryKey: orpc.exercises.listByCategory.key(),
			}),
		);
	}

	if (exerciseQueryIsInUse(queryClient, orpc.exercises.search.key())) {
		invalidations.push(
			queryClient.invalidateQueries({
				queryKey: orpc.exercises.search.key(),
			}),
		);
	}

	void Promise.all(invalidations);
}
