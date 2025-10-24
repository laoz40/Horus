import {
	MODAL,
	MODAL_MESSAGE,
	MODAL_PRIMARY_BUTTON,
	MODAL_SECONDARY_BUTTON,
	MODAL_TITLE,
} from "./constants.js";
import type { Workout } from "./types.js";
import { displayFullDate } from "./utils.js";

export const modalMessages = {
	continueWorkout: (
		workoutName: string,
		onContinue: () => void,
		onStartNew: () => void,
	) => ({
		title: `Continue ${workoutName}?`,
		message: `You have an unsaved workout. Would you like to continue where you left off?`,
		primaryText: "Continue",
		secondaryText: "Start New",
		onPrimary: onContinue,
		onSecondary: onStartNew,
	}),
	noExercises: {
		title: "No Exercises",
		message: "Please add at least one exercise to your workout.",
	},
	missingExerciseName: {
		title: "Missing Exercise Name",
		message: "Please enter a name for each exercise.",
	},
	missingReps: (setNumber: number, exerciseName: string) => ({
		title: "Missing Reps",
		message: `Please enter reps for <strong>Set ${setNumber}</strong> of <strong>${exerciseName}</strong>.`,
	}),
	missingWeight: (setNumber: number, exerciseName: string) => ({
		title: "Missing Weight",
		message: `Please enter a weight for <strong>Set ${setNumber}</strong> of <strong>${exerciseName}</strong>.`,
	}),
	deleteSet: (setNumber: number, exerciseName: string) => ({
		title: "Delete set?",
		message: `Delete <strong>Set ${setNumber}</strong> from <strong>${exerciseName}</strong>?`,
		primaryText: "Delete",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
	}),
	deleteWorkout: (workoutToDelete: Workout) => ({
		title: "Delete workout?",
		message: `Delete workout "<strong>${workoutToDelete.name}</strong>" from ${displayFullDate(workoutToDelete.date)}? This cannot be undone.`,
		primaryText: "Delete",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
	}),
	saveWorkout: (currentWorkout: Workout) => ({
		title: "Workout saved",
		message: `Your workout "<strong>${currentWorkout.name}</strong>" has been saved.`,
	}),
	updateWorkout: (currentWorkout: Workout) => ({
		title: "Workout updated",
		message: `Your workout "<strong>${currentWorkout.name}</strong>" has been updated.`,
	}),
	discardChanges: () => ({
		title: "Discard Changes",
		message: "Are you sure you want to discard these changes?",
		primaryText: "Discard",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
	}),
	incompleteExercise: (exerciseNames: string[]) => ({
		title: `Incomplete ${exerciseNames.length === 1 ? "Exercise" : "Exercises"}`,
		message: `The following ${exerciseNames.length === 1 ? "exercise has" : "exercises have"} no complete sets: <br><br>• ${exerciseNames.join("<br>• ")}`,
	}),
} as const;

// creates a modal with a title, message, and optional primary and secondary buttons
export function openModal({
	title = "Notice",
	message = "",
	primaryText = "OK",
	primaryButtonClass = "",
	secondaryText = "",
	onPrimary = null as (() => void) | null,
	onSecondary = null as (() => void) | null,
} = {}) {
	// Fallbacks for when the modal elements don't exist
	if (!MODAL || !MODAL_TITLE || !MODAL_MESSAGE || !MODAL_PRIMARY_BUTTON) {
		if (secondaryText) {
			const ok = confirm(`${title ? `${title}\n\n` : ""}${message}`.trim());
			if (ok) onPrimary?.();
			else onSecondary?.();
		} else {
			alert(`${title ? `${title}\n\n` : ""}${message}`.trim());
			onPrimary?.();
		}
		return;
	}

	// Set modal content
	MODAL_TITLE.textContent = title;
	MODAL_MESSAGE.innerHTML = message;
	MODAL_PRIMARY_BUTTON.textContent = primaryText;
	MODAL_PRIMARY_BUTTON.className = primaryButtonClass;

	// Configure secondary button if needed
	if (MODAL_SECONDARY_BUTTON) {
		if (secondaryText) {
			MODAL_SECONDARY_BUTTON.textContent = secondaryText;
			MODAL_SECONDARY_BUTTON.hidden = false;
		} else {
			MODAL_SECONDARY_BUTTON.hidden = true;
		}
	}

	// Handle primary button click
	MODAL_PRIMARY_BUTTON.addEventListener(
		"click",
		() => {
			onPrimary?.();
			MODAL?.close();
		},
		{ once: true },
	);

	// Handle secondary button click if it exists and is visible
	if (MODAL_SECONDARY_BUTTON && !MODAL_SECONDARY_BUTTON.hidden) {
		MODAL_SECONDARY_BUTTON.addEventListener(
			"click",
			() => {
				onSecondary?.();
				MODAL?.close();
			},
			{ once: true },
		);
	}

	// Close modal when clicking outside
	MODAL.addEventListener("click", (backdropClick: MouseEvent) => {
		if (!MODAL) return;

		const dialogDimensions = MODAL.getBoundingClientRect();
		const isOutside =
			backdropClick.clientX < dialogDimensions.left ||
			backdropClick.clientX > dialogDimensions.right ||
			backdropClick.clientY < dialogDimensions.top ||
			backdropClick.clientY > dialogDimensions.bottom;

		if (isOutside) {
			MODAL.close();
		}
	});

	MODAL.showModal();
}
