"use client";

import { useState } from "react";

import { isDefinedError, type InferClientErrorUnion } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStore } from "zustand/vanilla";

import type { MuscleGroupCategory } from "@/features/exercise-library/lib/muscleGroupCategories";
import {
	unionSelectedCategories,
	writeSelectedCategories,
} from "@/features/exercise-library/lib/exerciseMuscleCategories";
import {
	type ExerciseCatalogItem,
	type OpenExerciseEditorState,
	getExerciseEditInitialName,
	getExerciseEditInitialCategories,
} from "@/features/exercise-library/lib/exerciseEditor";
import {
	addExerciseToListCache,
	mergeExercisesInListCache,
	patchExerciseListCache,
	removeExerciseFromListCache,
} from "@/features/exercise-library/lib/exerciseListCache";
import { invalidateExerciseCache } from "@/lib/orpc/mutationCache";
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

type ExerciseEditorEvent =
	| { event: "NAME_CHANGED"; name: string }
	| { event: "CATEGORIES_CHANGED"; categories: MuscleGroupCategory[] }
	| { event: "SAVE" }
	| { event: "DELETE" }
	| { event: "COMBINE" }
	| { event: "CANCEL_MERGE" }
	| {
			event: "FAILED";
			error: Parameters<typeof handleMutationError>[0];
			action: keyof typeof mutationErrorMessages;
	  };

type ExerciseEditOperation =
	| { state: "editing" }
	| { state: "saving" }
	| { state: "deleting" }
	| { state: "confirmingMerge"; existingExercise: ExerciseCatalogItem }
	| { state: "combining"; existingExercise: ExerciseCatalogItem };

type ExerciseEditorStore = {
	state: ExerciseEditOperation;
	name: string;
	categories: MuscleGroupCategory[];
	send: (event: ExerciseEditorEvent) => void;
};

interface UseExerciseEditorOptions {
	editor: OpenExerciseEditorState;
	onClose: () => void;
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

function failureState(
	state: ExerciseEditOperation,
	error: Parameters<typeof handleMutationError>[0],
) {
	if (state.state === "saving" && isDefinedError(error) && error.code === "NAME_COLLISION") {
		return {
			state: { state: "confirmingMerge", existingExercise: error.data.existingExercise },
			report: false,
		} as const;
	}

	if (state.state === "combining")
		return {
			state: { state: "confirmingMerge", existingExercise: state.existingExercise },
			report: true,
		} as const;

	return { state: { state: "editing" }, report: true } as const;
}

function canSend(
	event: ExerciseEditorEvent,
	state: ExerciseEditOperation,
	editor: OpenExerciseEditorState,
) {
	if (event.event === "SAVE") return state.state === "editing";

	if (event.event === "DELETE") return state.state === "editing" && editor.state === "edit";

	if (event.event === "COMBINE") return state.state === "confirmingMerge";

	return true;
}

export function useExerciseEditor({ editor, onClose }: UseExerciseEditorOptions) {
	const queryClient = useQueryClient();

	const saveExercise = useMutation({
		mutationFn: ({ name, categories }: Pick<ExerciseEditorStore, "name" | "categories">) => {
			const input = { name: name.trim(), muscleGroups: writeSelectedCategories(categories) };

			if (editor.state === "create") return orpc.exercises.create.call(input);

			return orpc.exercises.update.call({ id: editor.exercise.id, ...input });
		},
		onSuccess: (data) => {
			if (editor.state === "create") {
				addExerciseToListCache(queryClient, data.exercise);
				showInfoToast("Exercise added");
			} else {
				patchExerciseListCache(queryClient, data.exercise);
				showInfoToast("Exercise saved");
			}

			finish("catalog");
		},
		onError: (error: Parameters<typeof handleMutationError>[0]) =>
			reportFailure(error, editor.state === "create" ? "add" : "save"),
	});

	const deleteExercise = useMutation({
		mutationFn: async () => {
			if (editor.state !== "edit") throw new Error("Cannot delete an unsaved exercise.");

			await orpc.exercises.delete.call({ id: editor.exercise.id });

			return editor.exercise.id;
		},
		onSuccess: (exerciseId) => {
			removeExerciseFromListCache(queryClient, exerciseId);
			showExerciseDeletedToast();
			finish("catalog");
		},
		onError: (error: Parameters<typeof handleMutationError>[0]) => reportFailure(error, "delete"),
	});

	const combineExercises = useMutation({
		mutationFn: async ({
			existingExercise,
			categories,
		}: {
			existingExercise: ExerciseCatalogItem;
			categories: MuscleGroupCategory[];
		}) => {
			if (editor.state === "create") {
				const data = await orpc.exercises.update.call({
					id: existingExercise.id,
					name: existingExercise.name,
					muscleGroups: unionSelectedCategories(existingExercise.muscleGroups, categories),
				});

				return data.exercise;
			}

			const data = await orpc.exercises.merge.call({
				sourceId: editor.exercise.id,
				targetId: existingExercise.id,
				sourceMuscleGroups: writeSelectedCategories(categories),
			});

			return data.targetExercise;
		},
		onSuccess: (exercise) => {
			if (editor.state === "create") {
				patchExerciseListCache(queryClient, exercise);
				showInfoToast("Exercise saved");
				finish("catalog");
			} else {
				mergeExercisesInListCache(queryClient, editor.exercise.id, exercise);
				showInfoToast("Exercises combined");
				finish("merge");
			}
		},
		onError: (error: Parameters<typeof handleMutationError>[0]) =>
			reportFailure(error, editor.state === "create" ? "save" : "combine"),
	});

	const [store] = useState(function initializeStore() {
		return createStore<ExerciseEditorStore>()((set, get) => ({
			state: { state: "editing" },
			name: getExerciseEditInitialName(editor),
			categories: getExerciseEditInitialCategories(editor),
			send(event) {
				const { state, name, categories } = get();

				if (!canSend(event, state, editor)) return;

				switch (event.event) {
					case "FAILED": {
						const outcome = failureState(state, event.error);

						set({ state: outcome.state });

						if (outcome.report) handleMutationError(event.error, event.action);

						return;
					}

					case "NAME_CHANGED":
						set({ name: event.name });

						return;
					case "CATEGORIES_CHANGED":
						set({ categories: event.categories });

						return;
					case "CANCEL_MERGE":
						if (state.state === "confirmingMerge") set({ state: { state: "editing" } });

						return;
					case "SAVE":
						set({ state: { state: "saving" } });
						saveExercise.mutate({ name, categories });

						return;
					case "DELETE":
						set({ state: { state: "deleting" } });
						deleteExercise.mutate();

						return;
					case "COMBINE":
						if (state.state !== "confirmingMerge") return;

						set({ state: { state: "combining", existingExercise: state.existingExercise } });
						combineExercises.mutate({ existingExercise: state.existingExercise, categories });

						return;
					default: {
						const exhaustiveEvent: never = event;

						return exhaustiveEvent;
					}
				}
			},
		}));
	});

	function finish(kind: "catalog" | "merge") {
		onClose();
		invalidateExerciseCache(queryClient, { kind });
	}

	function reportFailure(
		error: Parameters<typeof handleMutationError>[0],
		action: keyof typeof mutationErrorMessages,
	) {
		store.getState().send({ event: "FAILED", error, action });
	}

	return store;
}

export type ExerciseEditorStoreApi = ReturnType<typeof useExerciseEditor>;
