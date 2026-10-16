"use client";

import { useReducer } from "react";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MuscleGroupCategory } from "@/features/exercise-library/lib/muscleGroupCategories";
import {
	unionSelectedCategories,
	writeSelectedCategories,
} from "@/features/exercise-library/lib/exerciseMuscleCategories";
import type { OpenExerciseEditSheetState } from "@/features/exercise-library/lib/exerciseEditSheet";
import {
	addExerciseToListCache,
	invalidateExerciseQueriesInBackground,
	mergeExercisesInListCache,
	patchExerciseListCache,
	removeExerciseFromListCache,
} from "@/features/exercise-library/lib/invalidateExerciseQueries";
import { exerciseEditOperationReducer } from "@/features/exercise-library/lib/exerciseEditOperation";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showExerciseDeletedToast, showInfoToast } from "@/lib/toastMessages";

interface UseExerciseEditMutationsOptions {
	state: OpenExerciseEditSheetState;
	onClose: () => void;
}

export function useExerciseEditMutations({ state, onClose }: UseExerciseEditMutationsOptions) {
	const queryClient = useQueryClient();
	const [operation, dispatch] = useReducer(exerciseEditOperationReducer, { kind: "editing" });

	const createExercise = useMutation(
		orpc.exercises.create.mutationOptions({
			onSettled: () => dispatch({ kind: "requestFinished" }),
			onSuccess: (result) => {
				addExerciseToListCache(queryClient, result.exercise);
				showInfoToast("Exercise added");
				onClose();
				invalidateExerciseQueriesInBackground(queryClient);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to add exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						dispatch({
							kind: "duplicateNameFound",
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
			onSettled: () => dispatch({ kind: "requestFinished" }),
			onSuccess: (result) => {
				patchExerciseListCache(queryClient, result.exercise);
				showInfoToast("Exercise saved");
				onClose();
				invalidateExerciseQueriesInBackground(queryClient);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save exercise.");
					console.error(error);

					return;
				}

				switch (error.code) {
					case "NAME_COLLISION":
						dispatch({
							kind: "duplicateNameFound",
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
			onSettled: () => dispatch({ kind: "requestFinished" }),
			onSuccess: (result, variables) => {
				mergeExercisesInListCache(queryClient, variables.sourceId, result.targetExercise);
				showInfoToast("Exercises combined");
				onClose();
				invalidateExerciseQueriesInBackground(queryClient);
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
			onSettled: () => dispatch({ kind: "requestFinished" }),
			onSuccess: (_result, variables) => {
				removeExerciseFromListCache(queryClient, variables.id);
				showExerciseDeletedToast();
				onClose();
				invalidateExerciseQueriesInBackground(queryClient);
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
		if (operation.kind !== "editing") return;
		dispatch({ kind: "start", operation: "saving" });

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

	function combineExercises(categories: MuscleGroupCategory[]) {
		if (operation.kind !== "confirmingMerge") return;
		dispatch({ kind: "confirmMerge" });

		const muscleGroups = writeSelectedCategories(categories);
		const { existingExercise } = operation;

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
		if (state.kind !== "edit" || operation.kind !== "editing") {
			return;
		}

		dispatch({ kind: "start", operation: "deleting" });
		deleteExercise.mutate({ id: state.exercise.id });
	}

	return {
		saveExercise,
		combineExercises,
		deleteCurrentExercise,
		operation,
		cancelMerge: () => dispatch({ kind: "cancelMerge" }),
	};
}
