import { createStore } from "zustand";

type ExerciseSelection =
	| { state: "none" }
	| { state: "selected"; exerciseId: string }
	| { state: "editing"; exerciseId: string };

type ExerciseSelectionStoreState = {
	exerciseSelection: ExerciseSelection;
	actions: {
		selectExercise: (exerciseId: string | null) => void;
		toggleExerciseEdit: (exerciseId: string | null) => void;
		selectExerciseAfterDeletion: (nextExerciseId: string | null) => void;
	};
};

export const selectSelectedExerciseId = (
	store: ExerciseSelectionStoreState,
	exerciseIds: string[],
) =>
	store.exerciseSelection.state === "none"
		? (exerciseIds[0] ?? null)
		: store.exerciseSelection.exerciseId;

export const createExerciseSelectionStore = () =>
	createStore<ExerciseSelectionStoreState>()((set) => ({
		exerciseSelection: { state: "none" },
		actions: {
			selectExercise: (exerciseId) =>
				set((store) => {
					if (exerciseId === null) return { exerciseSelection: { state: "none" } };

					const selection = store.exerciseSelection;

					switch (selection.state) {
						case "none":
							return { exerciseSelection: { state: "selected", exerciseId } };
						case "selected":
							if (selection.exerciseId === exerciseId) return store;

							return { exerciseSelection: { state: "selected", exerciseId } };
						case "editing":
							if (selection.exerciseId === exerciseId) return store;

							return { exerciseSelection: { state: "editing", exerciseId } };
						default: {
							const exhaustiveState: never = selection;

							return exhaustiveState;
						}
					}
				}),
			toggleExerciseEdit: (exerciseId) =>
				set((store) => {
					if (exerciseId === null) return { exerciseSelection: { state: "none" } };

					const selection = store.exerciseSelection;

					switch (selection.state) {
						case "none":
						case "selected":
							return { exerciseSelection: { state: "editing", exerciseId } };
						case "editing":
							return { exerciseSelection: { state: "selected", exerciseId } };
						default: {
							const exhaustiveState: never = selection;

							return exhaustiveState;
						}
					}
				}),
			selectExerciseAfterDeletion: (nextExerciseId) =>
				set(() => {
					if (nextExerciseId === null) return { exerciseSelection: { state: "none" } };

					return { exerciseSelection: { state: "selected", exerciseId: nextExerciseId } };
				}),
		},
	}));

export type ExerciseSelectionStore = ReturnType<typeof createExerciseSelectionStore>;
