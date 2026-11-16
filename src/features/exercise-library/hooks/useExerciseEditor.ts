"use client";

import { useState } from "react";

import { isDefinedError, safe, type InferClientErrorUnion } from "@orpc/client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useStore } from "zustand";
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
	| { event: "CANCEL_MERGE" };

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
	send: (event: ExerciseEditorEvent) => Promise<void>;
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

function createExerciseEditorStore({
	editor,
	onClose,
	queryClient,
}: UseExerciseEditorOptions & { queryClient: QueryClient }) {
	return createStore<ExerciseEditorStore>()((set, get) => {
		function fail(
			error: Parameters<typeof handleMutationError>[0],
			action: keyof typeof mutationErrorMessages,
		) {
			const { state } = get();

			if (state.state === "saving" && isDefinedError(error) && error.code === "NAME_COLLISION") {
				set({
					state: { state: "confirmingMerge", existingExercise: error.data.existingExercise },
				});

				return;
			}

			if (state.state === "combining") {
				set({
					state: { state: "confirmingMerge", existingExercise: state.existingExercise },
				});
			} else {
				set({ state: { state: "editing" } });
			}

			handleMutationError(error, action);
		}

		async function save() {
			const { name, categories } = get();
			const input = { name: name.trim(), muscleGroups: writeSelectedCategories(categories) };
			set({ state: { state: "saving" } });

			let request;

			if (editor.state === "create") {
				request = orpc.exercises.create.call(input);
			} else {
				request = orpc.exercises.update.call({ id: editor.exercise.id, ...input });
			}

			const result = await safe(request);

			if (result.error) return fail(result.error, editor.state === "create" ? "add" : "save");

			const updateCache =
				editor.state === "create" ? addExerciseToListCache : patchExerciseListCache;

			updateCache(queryClient, result.data.exercise);
			showInfoToast(editor.state === "create" ? "Exercise added" : "Exercise saved");
			onClose();
			invalidateExerciseCache(queryClient, { kind: "catalog" });
		}

		async function remove() {
			if (editor.state !== "edit") return;
			const exerciseId = editor.exercise.id;
			set({ state: { state: "deleting" } });
			const result = await safe(orpc.exercises.delete.call({ id: exerciseId }));

			if (result.error) return fail(result.error, "delete");

			removeExerciseFromListCache(queryClient, exerciseId);
			showExerciseDeletedToast();
			onClose();
			invalidateExerciseCache(queryClient, { kind: "catalog" });
		}

		async function combineIntoExisting(
			existingExercise: ExerciseCatalogItem,
			categories: MuscleGroupCategory[],
		) {
			set({ state: { state: "combining", existingExercise } });

			const result = await safe(
				orpc.exercises.update.call({
					id: existingExercise.id,
					name: existingExercise.name,
					muscleGroups: unionSelectedCategories(existingExercise.muscleGroups, categories),
				}),
			);

			if (result.error) return fail(result.error, "save");

			patchExerciseListCache(queryClient, result.data.exercise);
			showInfoToast("Exercise saved");
			onClose();
			invalidateExerciseCache(queryClient, { kind: "catalog" });
		}

		async function merge(
			sourceId: string,
			existingExercise: ExerciseCatalogItem,
			categories: MuscleGroupCategory[],
		) {
			set({ state: { state: "combining", existingExercise } });

			const result = await safe(
				orpc.exercises.merge.call({
					sourceId,
					targetId: existingExercise.id,
					sourceMuscleGroups: writeSelectedCategories(categories),
				}),
			);

			if (result.error) return fail(result.error, "combine");

			mergeExercisesInListCache(queryClient, sourceId, result.data.targetExercise);
			showInfoToast("Exercises combined");
			onClose();
			invalidateExerciseCache(queryClient, { kind: "merge" });
		}

		return {
			state: { state: "editing" },
			name: getExerciseEditInitialName(editor),
			categories: getExerciseEditInitialCategories(editor),
			async send(event) {
				const { state, categories } = get();

				switch (event.event) {
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
						if (state.state === "editing") await save();

						return;
					case "DELETE":
						if (state.state === "editing") await remove();

						return;
					case "COMBINE":
						if (state.state !== "confirmingMerge") return;

						if (editor.state === "create") {
							await combineIntoExisting(state.existingExercise, categories);
						} else {
							await merge(editor.exercise.id, state.existingExercise, categories);
						}

						return;
					default: {
						const exhaustiveEvent: never = event;

						return exhaustiveEvent;
					}
				}
			},
		};
	});
}

export function useExerciseEditor({ editor, onClose }: UseExerciseEditorOptions) {
	const queryClient = useQueryClient();
	const [store] = useState(() => createExerciseEditorStore({ editor, onClose, queryClient }));

	return useStore(store);
}
