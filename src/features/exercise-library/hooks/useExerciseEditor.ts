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

function createExerciseEditorStore({
	editor,
	onClose,
	queryClient,
}: UseExerciseEditorOptions & { queryClient: QueryClient }) {
	async function save(name: string, categories: MuscleGroupCategory[]) {
		const input = { name: name.trim(), muscleGroups: writeSelectedCategories(categories) };
		let request;

		if (editor.state === "create") request = orpc.exercises.create.call(input);
		else request = orpc.exercises.update.call({ id: editor.exercise.id, ...input });

		const result = await safe(request);

		if (result.error)
			return { error: result.error, action: editor.state === "create" ? "add" : "save" } as const;

		const updateCache = editor.state === "create" ? addExerciseToListCache : patchExerciseListCache;

		updateCache(queryClient, result.data.exercise);
		showInfoToast(editor.state === "create" ? "Exercise added" : "Exercise saved");
	}

	async function remove() {
		if (editor.state !== "edit") return;

		const exerciseId = editor.exercise.id;
		const result = await safe(orpc.exercises.delete.call({ id: exerciseId }));

		if (result.error) return { error: result.error, action: "delete" } as const;

		removeExerciseFromListCache(queryClient, exerciseId);
		showExerciseDeletedToast();
	}

	async function combine(existingExercise: ExerciseCatalogItem, categories: MuscleGroupCategory[]) {
		if (editor.state === "create") {
			const result = await safe(
				orpc.exercises.update.call({
					id: existingExercise.id,
					name: existingExercise.name,
					muscleGroups: unionSelectedCategories(existingExercise.muscleGroups, categories),
				}),
			);

			if (result.error) return { error: result.error, action: "save" } as const;

			patchExerciseListCache(queryClient, result.data.exercise);
			showInfoToast("Exercise saved");

			return;
		}

		const sourceId = editor.exercise.id;

		const result = await safe(
			orpc.exercises.merge.call({
				sourceId,
				targetId: existingExercise.id,
				sourceMuscleGroups: writeSelectedCategories(categories),
			}),
		);

		if (result.error) return { error: result.error, action: "combine" } as const;

		mergeExercisesInListCache(queryClient, sourceId, result.data.targetExercise);
		showInfoToast("Exercises combined");
	}

	async function mutate(
		event: "SAVE" | "DELETE" | "COMBINE",
		state: ExerciseEditOperation,
		name: string,
		categories: MuscleGroupCategory[],
	) {
		let failure;

		if (event === "SAVE") {
			failure = await save(name, categories);
		} else if (event === "DELETE") {
			failure = await remove();
		} else if (state.state === "confirmingMerge") {
			failure = await combine(state.existingExercise, categories);
		} else {
			return;
		}

		if (failure) return failure;

		onClose();
		invalidateExerciseCache(queryClient, {
			kind: event === "COMBINE" && editor.state === "edit" ? "merge" : "catalog",
		});
	}

	return createStore<ExerciseEditorStore>()((set, get) => ({
		state: { state: "editing" },
		name: getExerciseEditInitialName(editor),
		categories: getExerciseEditInitialCategories(editor),
		async send(event) {
			const { state, name, categories } = get();

			if (!canSend(event, state, editor)) return;

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
					set({ state: { state: "saving" } });
					break;
				case "DELETE":
					set({ state: { state: "deleting" } });
					break;
				case "COMBINE":
					if (state.state === "confirmingMerge")
						set({ state: { state: "combining", existingExercise: state.existingExercise } });
					break;
				default: {
					const exhaustiveEvent: never = event;

					return exhaustiveEvent;
				}
			}

			const failure = await mutate(event.event, state, name, categories);

			if (!failure) return;
			const outcome = failureState(get().state, failure.error);

			set({ state: outcome.state });

			if (outcome.report) handleMutationError(failure.error, failure.action);
		},
	}));
}

export function useExerciseEditor({ editor, onClose }: UseExerciseEditorOptions) {
	const queryClient = useQueryClient();
	const [store] = useState(() => createExerciseEditorStore({ editor, onClose, queryClient }));

	return useStore(store);
}
