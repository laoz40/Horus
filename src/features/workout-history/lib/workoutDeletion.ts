import { useRef, useState } from "react";
import { isDefinedError, type InferClientErrorUnion } from "@orpc/client";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast } from "@/lib/toastMessages";

type DeletionState = { state: "idle" } | { state: "confirming" } | { state: "deleting" };

type DeletionEvent =
	| { event: "OPEN" }
	| { event: "CLOSE" }
	| { event: "CONFIRM" }
	| { event: "SETTLED" };

function transitionDeletion(current: DeletionState, event: DeletionEvent): DeletionState {
	let next: DeletionState;

	switch (event.event) {
		case "OPEN":
			if (current.state !== "idle") return current;
			next = { state: "confirming" };
			break;
		case "CLOSE":
			// Closing the confirmation does not finish an active deletion.
			if (current.state !== "confirming") return current;
			next = { state: "idle" };
			break;
		case "CONFIRM":
			if (current.state !== "confirming") return current;
			next = { state: "deleting" };
			break;
		case "SETTLED":
			if (current.state !== "deleting") return current;
			next = { state: "idle" };
			break;
		default: {
			const exhaustiveEvent: never = event;

			return exhaustiveEvent;
		}
	}

	return next;
}

export function reportDeletionError(
	error: InferClientErrorUnion<(typeof orpc.workouts)["delete" | "deleteAll"]["call"]>,
	onUnexpectedError: (cause: unknown) => void,
) {
	if (!isDefinedError(error)) {
		onUnexpectedError(error);

		return;
	}

	switch (error.code) {
		case "NOT_FOUND":
			showErrorToast("Couldn't find workout in the database.");

			return;
		case "NO_WORKOUTS":
			showErrorToast("No workouts to delete.");

			return;
		case "DATABASE_ERROR":
			showErrorToast("Couldn't access the database. Please try again.");

			return;
		case "UNAUTHORIZED":
			showErrorToast("You must be signed in to delete workouts.");

			return;
		default: {
			const exhaustiveError: never = error;

			return exhaustiveError;
		}
	}
}

export function useWorkoutDeletionMachine({ remove }: { remove: () => void }) {
	const [state, setState] = useState<DeletionState>({ state: "idle" });
	// Block overlapping requests before React renders the deleting state.
	const deletionInProgress = useRef(false);

	function send(event: DeletionEvent): void {
		if (event.event === "SETTLED") {
			deletionInProgress.current = false;
			setState((current) => transitionDeletion(current, event));

			return;
		}

		if (deletionInProgress.current) return;

		setState((current) => transitionDeletion(current, event));

		if (event.event !== "CONFIRM" || state.state !== "confirming") return;

		deletionInProgress.current = true;
		remove();
	}

	return { state, send };
}
