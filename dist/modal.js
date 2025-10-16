import { MODAL_BG_OVERLAY, MODAL_TITLE, MODAL_MESSAGE, MODAL_PRIMARY_BUTTON, MODAL_SECONDARY_BUTTON } from "./constants.js";
export const modalMessages = {
    noExercises: {
        title: "No Exercises",
        message: "Please add at least one exercise to your workout.",
    },
    missingExerciseName: {
        title: "Missing Exercise Name",
        message: "Please enter a name for each exercise.",
    },
    missingReps: (setNumber, exerciseName) => ({
        title: "Missing Reps",
        message: `Please enter reps for Set ${setNumber} of ${exerciseName}.`,
    }),
    missingWeight: (setNumber, exerciseName) => ({
        title: "Missing Weight",
        message: `Please enter a weight for Set ${setNumber} of ${exerciseName}.`,
    }),
    deleteSet: (setNumber, exerciseName) => ({
        title: "Delete set?",
        message: `Delete Set ${setNumber} from ${exerciseName}?`,
        primaryText: "Delete",
        primaryButtonClass: "danger",
        secondaryText: "Cancel",
    }),
    deleteWorkout: (workoutToDelete) => ({
        title: 'Delete workout?',
        message: `Delete workout "${workoutToDelete.name}" from ${workoutToDelete.date}? This cannot be undone.`,
        primaryText: 'Delete',
        primaryButtonClass: 'danger',
        secondaryText: 'Cancel',
    }),
    resumeWorkout: (onContinue, onDiscard, workoutName = 'the last workout') => ({
        title: `Resume ${workoutName}?`,
        message: `Do you want to continue editing workout "${workoutName}" or start a new one?`,
        primaryText: 'Continue',
        secondaryText: 'Start New',
        onPrimary: onContinue,
        onSecondary: onDiscard,
    }),
    saveWorkout: (currentWorkout) => ({
        title: "Workout saved",
        message: `Your workout "${currentWorkout.name}" has been saved.`,
    }),
    updateWorkout: (currentWorkout) => ({
        title: "Workout updated",
        message: `Your workout "${currentWorkout.name}" has been updated.`,
    }),
};
// creates a modal dialog with a title, message, and optional primary and secondary buttons
export function openModal({ title = "Notice", message = "", primaryText = "OK", primaryButtonClass = "", secondaryText = "", onPrimary = null, onSecondary = null, onBackdropClick = null, dismissOnBackdrop = true, dismissOnEsc = true, } = {}) {
    // Fallbacks for when the modal elements don't exist
    if (!MODAL_BG_OVERLAY || !MODAL_TITLE || !MODAL_MESSAGE || !MODAL_PRIMARY_BUTTON || !MODAL_SECONDARY_BUTTON) {
        if (secondaryText) {
            // Fallback to ok/cancel if secondary button is specified
            const ok = confirm(`${title ? title + "\n\n" : ""}${message}`.trim());
            // Call the primary callback if the user clicked OK
            if (ok && typeof onPrimary === "function")
                onPrimary();
            // Call the secondary callback if the user clicked Cancel
            if (!ok && typeof onSecondary === "function")
                onSecondary();
        }
        else {
            // Simple alert fallback if no secondary button
            alert(`${title ? title + "\n\n" : ""}${message}`.trim());
            // Call the primary callback if the user clicked OK
            if (typeof onPrimary === "function")
                onPrimary();
        }
        // exit after fallback if we don't have the modal elements
        return;
    }
    // Set title, message, and primary button text to the provided values
    MODAL_TITLE.textContent = title;
    MODAL_MESSAGE.textContent = message;
    MODAL_PRIMARY_BUTTON.textContent = primaryText || "OK";
    // Set primary button class
    MODAL_PRIMARY_BUTTON.className = ""; // Reset any existing classes
    primaryButtonClass && MODAL_PRIMARY_BUTTON.classList.add(primaryButtonClass);
    // If secondary button is specified, set its text and visibility
    if (MODAL_SECONDARY_BUTTON) {
        if (secondaryText) {
            MODAL_SECONDARY_BUTTON.textContent = secondaryText;
            MODAL_SECONDARY_BUTTON.hidden = false;
        }
        else {
            MODAL_SECONDARY_BUTTON.hidden = true;
        }
    }
    // Event listeners for primary and secondary modal buttons
    const onPrimaryClick = () => {
        closeModal();
        // check for function in case its null
        typeof onPrimary === "function" && onPrimary();
    };
    const onSecondaryClick = () => {
        closeModal();
        // check for function in case its null
        typeof onSecondary === "function" && onSecondary();
    };
    const onBackdrop = (e) => {
        if (dismissOnBackdrop && e.target === MODAL_BG_OVERLAY) {
            // check for function in case its null
            if (typeof onBackdropClick === "function") {
                onBackdropClick();
                // fallback to secondary click if no function
            }
            else {
                onSecondaryClick();
            }
        }
    };
    // Event listener for escape key
    const onEsc = (e) => dismissOnEsc && e.key === "Escape" && onSecondaryClick();
    // Show the modal and add event listeners
    MODAL_BG_OVERLAY.hidden = false;
    MODAL_BG_OVERLAY.setAttribute("aria-hidden", "false");
    MODAL_PRIMARY_BUTTON.addEventListener("click", onPrimaryClick, { once: true });
    MODAL_SECONDARY_BUTTON &&
        !MODAL_SECONDARY_BUTTON.hidden &&
        MODAL_SECONDARY_BUTTON.addEventListener("click", onSecondaryClick, {
            once: true,
        });
    MODAL_BG_OVERLAY.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onEsc);
    // Close the modal and remove event listeners
    const closeModal = () => {
        // Hide the modal overlay if it exists
        MODAL_BG_OVERLAY === null || MODAL_BG_OVERLAY === void 0 ? void 0 : MODAL_BG_OVERLAY.setAttribute("aria-hidden", "true");
        MODAL_BG_OVERLAY && (MODAL_BG_OVERLAY.hidden = true);
        // Clean up event listeners
        MODAL_PRIMARY_BUTTON === null || MODAL_PRIMARY_BUTTON === void 0 ? void 0 : MODAL_PRIMARY_BUTTON.removeEventListener("click", onPrimaryClick);
        MODAL_SECONDARY_BUTTON === null || MODAL_SECONDARY_BUTTON === void 0 ? void 0 : MODAL_SECONDARY_BUTTON.removeEventListener("click", onSecondaryClick);
        MODAL_BG_OVERLAY === null || MODAL_BG_OVERLAY === void 0 ? void 0 : MODAL_BG_OVERLAY.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onEsc);
    };
}
//# sourceMappingURL=modal.js.map