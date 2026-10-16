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
			return state.kind === "editing" ? { kind: event.operation } : state;
		case "duplicateNameFound":
			return state.kind === "saving"
				? { kind: "confirmingMerge", existingExercise: event.existingExercise }
				: state;
		case "confirmMerge":
			return state.kind === "confirmingMerge"
				? { kind: "combining", existingExercise: state.existingExercise }
				: state;
		case "cancelMerge":
			return state.kind === "confirmingMerge" ? { kind: "editing" } : state;
		case "requestFinished":
			if (state.kind === "combining") {
				return { kind: "confirmingMerge", existingExercise: state.existingExercise };
			}

			return state.kind === "confirmingMerge" ? state : { kind: "editing" };
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}
}
