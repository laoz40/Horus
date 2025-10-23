import {
	MODAL,
	MODAL_MESSAGE,
	MODAL_PRIMARY_BUTTON,
	MODAL_SECONDARY_BUTTON,
	MODAL_TITLE,
} from "./constants.js";
import type { Workout } from "./types.js";

export const modalMessages = {
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
		message: `Please enter reps for Set ${setNumber} of ${exerciseName}.`,
	}),
	missingWeight: (setNumber: number, exerciseName: string) => ({
		title: "Missing Weight",
		message: `Please enter a weight for Set ${setNumber} of ${exerciseName}.`,
	}),
	deleteSet: (setNumber: number, exerciseName: string) => ({
		title: "Delete set?",
		message: `Delete Set ${setNumber} from ${exerciseName}?`,
		primaryText: "Delete",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
	}),
	deleteWorkout: (workoutToDelete: Workout) => ({
		title: "Delete workout?",
		message: `Delete workout "${workoutToDelete.name}" from ${workoutToDelete.date}? This cannot be undone.`,
		primaryText: "Delete",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
	}),
	resumeWorkout: (
		onContinue: () => void,
		onDiscard: () => void,
		workoutName: string = "the last workout",
	) => ({
		title: `Resume ${workoutName}?`,
		message: `Do you want to continue editing "${workoutName}" or start a new one?`,
		primaryText: "Continue",
		secondaryText: "Start New",
		onPrimary: onContinue,
		onSecondary: onDiscard,
	}),
	saveWorkout: (currentWorkout: Workout) => ({
		title: "Workout saved",
		message: `Your workout "${currentWorkout.name}" has been saved.`,
	}),
	updateWorkout: (currentWorkout: Workout) => ({
		title: "Workout updated",
		message: `Your workout "${currentWorkout.name}" has been updated.`,
	}),
	discardChanges: () => ({
		title: "Discard Changes",
		message: "Are you sure you want to discard these changes?",
		primaryText: "Discard",
		primaryButtonClass: "danger",
		secondaryText: "Cancel",
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
	MODAL_MESSAGE.textContent = message;
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

	// Handle modal action buttons
	const handleModalActions = () => {
		if (MODAL?.returnValue === "primary") {
			onPrimary?.();
		} else if (MODAL?.returnValue === "secondary") {
			onSecondary?.();
		}
	};

	const handlePrimaryClick = () => {
		MODAL?.close("primary");
	};

	const handleSecondaryClick = () => {
		MODAL?.close("secondary");
	};

	MODAL.addEventListener("close", handleModalActions, { once: true });
	MODAL_PRIMARY_BUTTON.addEventListener("click", handlePrimaryClick, {
		once: true,
	});

	if (MODAL_SECONDARY_BUTTON && !MODAL_SECONDARY_BUTTON.hidden) {
		MODAL_SECONDARY_BUTTON.addEventListener("click", handleSecondaryClick, {
			once: true,
		});
	}

	// Close modal when clicking outside
	MODAL.addEventListener("click", (backdropClick: MouseEvent) => {
		if (!MODAL) return;
		const dialogDimensions = MODAL.getBoundingClientRect();
		if (
			backdropClick.clientX < dialogDimensions.left ||
			backdropClick.clientX > dialogDimensions.right ||
			backdropClick.clientY < dialogDimensions.top ||
			backdropClick.clientY > dialogDimensions.bottom
		) {
			MODAL.close();
		}
	});

	MODAL.showModal();
}
