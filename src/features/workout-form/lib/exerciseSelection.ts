export type ExerciseSelection =
	| { kind: "none" }
	| { kind: "selected"; exerciseId: string }
	| { kind: "editing"; exerciseId: string };

type ExerciseSelectionEvent =
	| { kind: "selectExercise"; exerciseId: string | null }
	| { kind: "toggleEditing" }
	| { kind: "exerciseDeleted"; nextExerciseId: string | null };

export function exerciseSelectionReducer(
	state: ExerciseSelection,
	event: ExerciseSelectionEvent,
): ExerciseSelection {
	switch (event.kind) {
		case "selectExercise":
			if (event.exerciseId === null) return { kind: "none" };

			if (state.kind !== "none" && state.exerciseId === event.exerciseId) return state;

			if (state.kind === "editing") {
				return { kind: "editing", exerciseId: event.exerciseId };
			}

			return { kind: "selected", exerciseId: event.exerciseId };
		case "toggleEditing":
			if (state.kind === "none") return state;

			if (state.kind === "editing") {
				return { kind: "selected", exerciseId: state.exerciseId };
			}

			return { kind: "editing", exerciseId: state.exerciseId };
		case "exerciseDeleted":
			if (event.nextExerciseId === null) return { kind: "none" };

			return { kind: "selected", exerciseId: event.nextExerciseId };
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}
}
