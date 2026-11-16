import { create } from "zustand";

type ExerciseSelection =
	| { state: "none" }
	| { state: "selected"; exerciseId: string }
	| { state: "editing"; exerciseId: string };

type ExerciseSelectionEvent =
	| { event: "SELECT_EXERCISE"; exerciseId: string | null }
	| { event: "TOGGLE_EXERCISE_EDIT"; exerciseId: string | null }
	| { event: "SELECT_EXERCISE_AFTER_DELETION"; exerciseId: string | null }
	| { event: "RESET" };

type ExerciseSelectionStore = {
	exerciseSelection: ExerciseSelection;
	send: (event: ExerciseSelectionEvent) => void;
};

export const selectSelectedExerciseId = (store: ExerciseSelectionStore, exerciseIds: string[]) =>
	store.exerciseSelection.state === "none"
		? (exerciseIds[0] ?? null)
		: store.exerciseSelection.exerciseId;

export const useExerciseSelectionStore = create<ExerciseSelectionStore>()((set) => ({
	exerciseSelection: { state: "none" },
	send: (event) =>
		set((store) => {
			if (event.event === "RESET" || event.exerciseId === null) {
				return { exerciseSelection: { state: "none" } };
			}

			const { exerciseSelection } = store;
			const { exerciseId } = event;

			switch (event.event) {
				case "SELECT_EXERCISE":
					if (exerciseSelection.state === "none") {
						return { exerciseSelection: { state: "selected", exerciseId } };
					}

					if (exerciseSelection.exerciseId === exerciseId) return store;

					return { exerciseSelection: { state: exerciseSelection.state, exerciseId } };
				case "TOGGLE_EXERCISE_EDIT":
					return {
						exerciseSelection: {
							state: exerciseSelection.state === "editing" ? "selected" : "editing",
							exerciseId,
						},
					};
				case "SELECT_EXERCISE_AFTER_DELETION":
					return { exerciseSelection: { state: "selected", exerciseId } };
				default: {
					const exhaustiveEvent: never = event;

					return exhaustiveEvent;
				}
			}
		}),
}));
