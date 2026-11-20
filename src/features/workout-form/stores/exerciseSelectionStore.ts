import { createStore } from "zustand";

type State =
	| { type: "none" }
	| { type: "selected"; exerciseId: string }
	| { type: "editing"; exerciseId: string };

type ExerciseSelectionEvent =
	| { event: "SELECT_EXERCISE"; exerciseId: string | null }
	| { event: "TOGGLE_EXERCISE_EDIT"; exerciseId: string | null }
	| { event: "SELECT_EXERCISE_AFTER_DELETION"; exerciseId: string | null }
	| { event: "RESET" };

type ExerciseSelectionStoreState = {
	state: State;
	send: (event: ExerciseSelectionEvent) => void;
};

export const selectSelectedExerciseId = (
	store: ExerciseSelectionStoreState,
	exerciseIds: string[],
) => (store.state.type === "none" ? (exerciseIds[0] ?? null) : store.state.exerciseId);

export const createExerciseSelectionStore = () =>
	createStore<ExerciseSelectionStoreState>()((set, get) => ({
		state: { type: "none" },
		send(event) {
			const { state: selection } = get();

			switch (event.event) {
				case "SELECT_EXERCISE": {
					const { exerciseId } = event;

					if (exerciseId === null) return set({ state: { type: "none" } });

					if (selection.type !== "none" && selection.exerciseId === exerciseId) return;

					return set({
						state: {
							type: selection.type === "none" ? "selected" : selection.type,
							exerciseId,
						},
					});
				}

				case "TOGGLE_EXERCISE_EDIT":
					if (event.exerciseId === null) return set({ state: { type: "none" } });

					return set({
						state: {
							type: selection.type === "editing" ? "selected" : "editing",
							exerciseId: event.exerciseId,
						},
					});
				case "SELECT_EXERCISE_AFTER_DELETION":
					if (event.exerciseId === null) return set({ state: { type: "none" } });

					return set({ state: { type: "selected", exerciseId: event.exerciseId } });
				case "RESET":
					return set({ state: { type: "none" } });
				default: {
					const exhaustiveEvent: never = event;

					return exhaustiveEvent;
				}
			}
		},
	}));

export type ExerciseSelectionStore = ReturnType<typeof createExerciseSelectionStore>;
