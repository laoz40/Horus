"use client";

import { useReducer } from "react";

import { isDefinedError, type InferClientErrorUnion } from "@orpc/client";
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

const mutationErrorMessages = {
	add: {
		failure: "Failed to add exercise.",
		unauthorized: "You must be signed in to add exercises.",
	},
	save: {
		failure: "Failed to save exercise.",
		unauthorized: "You must be signed in to edit exercises.",
	},
	combine: {
		failure: "Failed to combine exercises.",
		unauthorized: "You must be signed in to combine exercises.",
	},
	delete: {
		failure: "Failed to delete exercise.",
		unauthorized: "You must be signed in to delete exercises.",
	},
};

interface UseExerciseEditMutationsOptions {
	state: OpenExerciseEditSheetState;
	onClose: () => void;
}

export function useExerciseEditMutations({ state, onClose }: UseExerciseEditMutationsOptions) {
	const queryClient = useQueryClient();
	const [operation, dispatch] = useReducer(exerciseEditOperationReducer, { kind: "editing" });

	function handleMutationError(
		error: InferClientErrorUnion<
			(typeof orpc.exercises)["create" | "update" | "merge" | "delete"]["call"]
		>,
		action: keyof typeof mutationErrorMessages,
	) {
		const messages = mutationErrorMessages[action];

		if (!isDefinedError(error)) {
			showErrorToast(messages.failure);
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
				showErrorToast(
					action === "combine"
						? "Couldn't find one of these exercises."
						: "Couldn't find this exercise.",
				);

				return;
			case "EXERCISE_IN_USE":
				showErrorToast("This exercise is used in workouts and cannot be deleted.");

				return;
			case "DATABASE_ERROR":
				showErrorToast("Couldn't access the database. Please try again.");

				return;
			case "UNAUTHORIZED":
				showErrorToast(messages.unauthorized);

				return;
			default: {
				const exhaustiveError: never = error;

				return exhaustiveError;
			}
		}
	}

	const createExercise = useMutation(
		orpc.exercises.create.mutationOptions({
			onSettled: () => dispatch({ kind: "requestFinished" }),
			onSuccess: (result) => {
				addExerciseToListCache(queryClient, result.exercise);
				showInfoToast("Exercise added");
				onClose();
				invalidateExerciseQueriesInBackground(queryClient);
			},
			onError: (error) => handleMutationError(error, "add"),
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
			onError: (error) => handleMutationError(error, "save"),
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
			onError: (error) => handleMutationError(error, "combine"),
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
			onError: (error) => handleMutationError(error, "delete"),
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
