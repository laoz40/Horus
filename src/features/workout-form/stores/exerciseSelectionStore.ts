import { create } from "zustand";

type ExerciseSelection =
	| { state: "none" }
	| { state: "selected"; exerciseId: string }
	| { state: "editing"; exerciseId: string };

type ExerciseSelectionStore = {
	exerciseSelection: ExerciseSelection;
	actions: {
		selectExercise: (exerciseId: string | null) => void;
		toggleExerciseEdit: (exerciseId: string | null) => void;
		selectExerciseAfterDeletion: (nextExerciseId: string | null) => void;
		reset: () => void;
	};
};

export const selectSelectedExerciseId = (store: ExerciseSelectionStore, exerciseIds: string[]) =>
	store.exerciseSelection.state === "none"
		? (exerciseIds[0] ?? null)
		: store.exerciseSelection.exerciseId;

export const useExerciseSelectionStore = create<ExerciseSelectionStore>()((set) => ({
	exerciseSelection: { state: "none" },
	actions: {
		selectExercise: (exerciseId) =>
			set((store) => {
				if (exerciseId === null) return { exerciseSelection: { state: "none" } };

				const selection = store.exerciseSelection;

				if (selection.state !== "none" && selection.exerciseId === exerciseId) return store;

				return {
					exerciseSelection: {
						state: selection.state === "editing" ? "editing" : "selected",
						exerciseId,
					},
				};
			}),
		toggleExerciseEdit: (exerciseId) =>
			set((store) => {
				if (exerciseId === null) return { exerciseSelection: { state: "none" } };

				return {
					exerciseSelection: {
						state: store.exerciseSelection.state === "editing" ? "selected" : "editing",
						exerciseId,
					},
				};
			}),
		selectExerciseAfterDeletion: (nextExerciseId) =>
			set(() => {
				if (nextExerciseId === null) return { exerciseSelection: { state: "none" } };

				return { exerciseSelection: { state: "selected", exerciseId: nextExerciseId } };
			}),
		reset: () => set({ exerciseSelection: { state: "none" } }),
	},
}));
