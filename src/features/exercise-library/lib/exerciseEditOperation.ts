import type { ExerciseCatalogItem } from "@/features/exercise-library/lib/exerciseEditSheet";

export type ExerciseEditOperation =
	| { kind: "editing" }
	| { kind: "saving" }
	| { kind: "deleting" }
	| { kind: "confirmingMerge"; existingExercise: ExerciseCatalogItem }
	| { kind: "combining"; existingExercise: ExerciseCatalogItem };

type ExerciseEditEvent =
	| { kind: "start"; operation: "saving" | "deleting" }
	| { kind: "duplicateNameFound"; existingExercise: ExerciseCatalogItem }
	| { kind: "confirmMerge" }
	| { kind: "cancelMerge" }
	| { kind: "requestFinished" };

export function exerciseEditOperationReducer(
	state: ExerciseEditOperation,
	event: ExerciseEditEvent,
): ExerciseEditOperation {
	switch (event.kind) {
		case "start":
			if (state.kind !== "editing") {
				return state;
			}

			return { kind: event.operation };
		case "duplicateNameFound":
			if (state.kind !== "saving") {
				return state;
			}

			return { kind: "confirmingMerge", existingExercise: event.existingExercise };
		case "confirmMerge":
			if (state.kind !== "confirmingMerge") {
				return state;
			}

			return { kind: "combining", existingExercise: state.existingExercise };
		case "cancelMerge":
			if (state.kind !== "confirmingMerge") {
				return state;
			}

			return { kind: "editing" };
		case "requestFinished":
			if (state.kind === "combining") {
				return { kind: "confirmingMerge", existingExercise: state.existingExercise };
			}

			if (state.kind === "confirmingMerge") {
				return state;
			}

			return { kind: "editing" };
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}
}
