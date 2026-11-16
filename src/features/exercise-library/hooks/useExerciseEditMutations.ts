"use client";

import { useState } from "react";

import { isDefinedError, type InferClientErrorUnion } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MuscleGroupCategory } from "@/features/exercise-library/lib/muscleGroupCategories";
import {
	unionSelectedCategories,
	writeSelectedCategories,
} from "@/features/exercise-library/lib/exerciseMuscleCategories";
import type {
	ExerciseCatalogItem,
	OpenExerciseEditSheetState,
} from "@/features/exercise-library/lib/exerciseEditSheet";
import {
	addExerciseToListCache,
	mergeExercisesInListCache,
	patchExerciseListCache,
	removeExerciseFromListCache,
} from "@/features/exercise-library/lib/exerciseListCache";
import { invalidateExerciseCache } from "@/lib/orpc/mutationCache";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showExerciseDeletedToast, showInfoToast } from "@/lib/toastMessages";

type ExerciseEditOperation =
	| { state: "editing" }
	| { state: "saving" }
	| { state: "deleting" }
	| { state: "confirmingMerge"; existingExercise: ExerciseCatalogItem }
	| { state: "combining"; existingExercise: ExerciseCatalogItem };

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
	sheet: OpenExerciseEditSheetState;
	onClose: () => void;
}

export function useExerciseEditMutations({ sheet, onClose }: UseExerciseEditMutationsOptions) {
	const queryClient = useQueryClient();
	const [operation, setOperation] = useState<ExerciseEditOperation>({ state: "editing" });

	function finishRequest() {
		setOperation((current) => {
			switch (current.state) {
				case "combining":
					return { state: "confirmingMerge", existingExercise: current.existingExercise };
				case "confirmingMerge":
					return current;
				case "editing":
				case "saving":
				case "deleting":
					return { state: "editing" };
				default: {
					const exhaustiveState: never = current;

					return exhaustiveState;
				}
			}
		});
	}

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
				setOperation((current) => {
					if (current.state !== "saving") return current;

					return {
						state: "confirmingMerge",
						existingExercise: error.data.existingExercise,
					};
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
			onSettled: finishRequest,
			onSuccess: (result) => {
				addExerciseToListCache(queryClient, result.exercise);
				showInfoToast("Exercise added");
				onClose();
				invalidateExerciseCache(queryClient, { kind: "catalog" });
			},
			onError: (error) => handleMutationError(error, "add"),
		}),
	);

	const updateExercise = useMutation(
		orpc.exercises.update.mutationOptions({
			onSettled: finishRequest,
			onSuccess: (result) => {
				patchExerciseListCache(queryClient, result.exercise);
				showInfoToast("Exercise saved");
				onClose();
				invalidateExerciseCache(queryClient, { kind: "catalog" });
			},
			onError: (error) => handleMutationError(error, "save"),
		}),
	);

	const mergeExercises = useMutation(
		orpc.exercises.merge.mutationOptions({
			onSettled: finishRequest,
			onSuccess: (result, variables) => {
				mergeExercisesInListCache(queryClient, variables.sourceId, result.targetExercise);
				showInfoToast("Exercises combined");
				onClose();
				invalidateExerciseCache(queryClient, { kind: "merge" });
			},
			onError: (error) => handleMutationError(error, "combine"),
		}),
	);

	const deleteExercise = useMutation(
		orpc.exercises.delete.mutationOptions({
			onSettled: finishRequest,
			onSuccess: (_result, variables) => {
				removeExerciseFromListCache(queryClient, variables.id);
				showExerciseDeletedToast();
				onClose();
				invalidateExerciseCache(queryClient, { kind: "catalog" });
			},
			onError: (error) => handleMutationError(error, "delete"),
		}),
	);

	function saveExercise(name: string, categories: MuscleGroupCategory[]) {
		if (operation.state !== "editing") return;
		setOperation({ state: "saving" });

		const muscleGroups = writeSelectedCategories(categories);

		if (sheet.state === "create") {
			createExercise.mutate({
				name,
				muscleGroups,
			});

			return;
		}

		updateExercise.mutate({
			id: sheet.exercise.id,
			name,
			muscleGroups,
		});
	}

	function combineExercises(categories: MuscleGroupCategory[]) {
		if (operation.state !== "confirmingMerge") return;
		setOperation({ state: "combining", existingExercise: operation.existingExercise });

		const muscleGroups = writeSelectedCategories(categories);
		const { existingExercise } = operation;

		if (sheet.state === "create") {
			updateExercise.mutate({
				id: existingExercise.id,
				name: existingExercise.name,
				muscleGroups: unionSelectedCategories(existingExercise.muscleGroups, categories),
			});

			return;
		}

		mergeExercises.mutate({
			sourceId: sheet.exercise.id,
			targetId: existingExercise.id,
			sourceMuscleGroups: muscleGroups,
		});
	}

	function deleteCurrentExercise() {
		if (sheet.state !== "edit" || operation.state !== "editing") {
			return;
		}

		setOperation({ state: "deleting" });
		deleteExercise.mutate({ id: sheet.exercise.id });
	}

	function cancelMerge() {
		setOperation((current) => {
			if (current.state !== "confirmingMerge") return current;

			return { state: "editing" };
		});
	}

	return { state: operation, saveExercise, combineExercises, deleteCurrentExercise, cancelMerge };
}
