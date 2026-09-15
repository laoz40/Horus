"use client";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MuscleGroupCategory } from "@/features/workout-form/lib/muscleGroupCategories";
import {
	unionSelectedCategories,
	writeSelectedCategories,
} from "@/features/settings/lib/exerciseMuscleCategories";
import type {
	ExerciseCatalogItem,
	OpenExerciseEditSheetState,
} from "@/features/settings/lib/exerciseEditSheet";
import { invalidateExerciseQueries } from "@/features/settings/lib/invalidateExerciseQueries";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showExerciseDeletedToast, showInfoToast } from "@/lib/toastMessages";

interface NameCollisionState {
	existingExercise: ExerciseCatalogItem;
}

interface UseExerciseEditMutationsOptions {
	state: OpenExerciseEditSheetState;
	onClose: () => void;
	onNameCollision: (collision: NameCollisionState) => void;
	onClearNameCollision: () => void;
}

export function useExerciseEditMutations({
	state,
	onClose,
	onNameCollision,
	onClearNameCollision,
}: UseExerciseEditMutationsOptions) {
	const queryClient = useQueryClient();

	const createExercise = useMutation(
		orpc.exercises.create.mutationOptions({
			onSuccess: async () => {
				showInfoToast("Exercise added");
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to add exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						onNameCollision({
							existingExercise: error.data.existingExercise,
						});

						return;
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to add exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const updateExercise = useMutation(
		orpc.exercises.update.mutationOptions({
			onSuccess: async () => {
				showInfoToast("Exercise saved");
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						onNameCollision({
							existingExercise: error.data.existingExercise,
						});

						return;
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to edit exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const mergeExercises = useMutation(
		orpc.exercises.merge.mutationOptions({
			onSuccess: async () => {
				showInfoToast("Exercises combined");
				await invalidateExerciseQueries(queryClient);
				onClearNameCollision();
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to combine exercises.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find one of these exercises.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to combine exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	const deleteExercise = useMutation(
		orpc.exercises.delete.mutationOptions({
			onSuccess: async () => {
				showExerciseDeletedToast();
				await invalidateExerciseQueries(queryClient);
				onClose();
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to delete exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "EXERCISE_NOT_FOUND":
						showErrorToast("Couldn't find this exercise.");

						return;
					case "EXERCISE_IN_USE":
						showErrorToast("This exercise is used in workouts and cannot be deleted.");

						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");

						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to delete exercises.");

						return;
					default: {
						const exhaustiveError: never = error;

						return exhaustiveError;
					}
				}
			},
		}),
	);

	function saveExercise(name: string, categories: MuscleGroupCategory[]) {
		const muscleGroups = writeSelectedCategories(categories);

		if (state.kind === "create") {
			createExercise.mutate({
				name,
				muscleGroups,
			});

			return;
		}

		updateExercise.mutate({
			id: state.exercise.id,
			name,
			muscleGroups,
		});
	}

	function combineExercises(nameCollision: NameCollisionState, categories: MuscleGroupCategory[]) {
		const muscleGroups = writeSelectedCategories(categories);
		const { existingExercise } = nameCollision;

		if (state.kind === "create") {
			updateExercise.mutate({
				id: existingExercise.id,
				name: existingExercise.name,
				muscleGroups: unionSelectedCategories(existingExercise.muscleGroups, categories),
			});

			return;
		}

		mergeExercises.mutate({
			sourceId: state.exercise.id,
			targetId: existingExercise.id,
			sourceMuscleGroups: muscleGroups,
		});
	}

	function deleteCurrentExercise() {
		if (state.kind !== "edit") {
			return;
		}

		deleteExercise.mutate({ id: state.exercise.id });
	}

	const isSaving = createExercise.isPending || updateExercise.isPending;
	const isCombining = mergeExercises.isPending || updateExercise.isPending;

	return {
		saveExercise,
		combineExercises,
		deleteCurrentExercise,
		isSaving,
		isCombining,
		isDeleting: deleteExercise.isPending,
	};
}

export type { NameCollisionState };
