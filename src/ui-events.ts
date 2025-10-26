// import all the functions and variables we need from other files
import {
	ADD_EXERCISE_BUTTON,
	BACK_BUTTON_WORKOUT,
	EXERCISE_FORM_CONTAINER,
	FINISH_WORKOUT_BUTTON,
	NEXT_EXERCISE_BUTTON,
	PREV_EXERCISE_BUTTON,
	START_WORKOUT_BUTTON,
} from "./constants.js";
import { setupNewWorkout } from "./data-storage.js";
import {
	applyWorkoutDraft,
	clearWorkoutDraft,
	loadWorkoutDraft,
	saveWorkoutDraft,
	wireDraftAutosave,
} from "./draft.js";
import { isInEditMode, saveEditedWorkout, saveNewWorkout, setEditData } from "./history.js";
import { SCHEMA_VERSION } from "./migration.js";
import { modalMessages, openModal } from "./modal.js";
import { showPage, wireNavButtons } from "./nav.js";
import type { Exercise, ExerciseSet } from "./types.js";
import { weekdays } from "./utils.js";
import { createExerciseForm, scrollToExercise, updateScrollButtons } from "./workout-builder.js";

// Wire up all the UI events
export function wireUiEvents() {
	// Start workout button
	if (START_WORKOUT_BUTTON) {
		START_WORKOUT_BUTTON.addEventListener("click", () => {
			// Check if there's a draft that has data
			const draft = loadWorkoutDraft();
			const hasDraft = !!(
				draft &&
				// Check if the draft has a name or exercises or sets
				(draft.name?.trim() ||
					draft.exercises?.some(
						(ex: Exercise) =>
							ex.name?.trim() ||
							ex.notes?.trim() ||
							ex.sets?.some(
								(s: ExerciseSet) => String(s.weight || "").trim() || String(s.reps || "").trim()
							)
					))
			);

			// If there's a draft, show the draft modal
			if (hasDraft) {
				// Show modal to confirm continuing draft or starting new
				const today = new Date();
				const dayName = weekdays[today.getDay()];
				const workoutName = draft?.name || `${dayName} Workout`;

				const continueAction = () => {
					showPage("new-workout-page");
					setupNewWorkout();
					applyWorkoutDraft(draft);
					wireDraftAutosave();
				};

				const startNewAction = () => {
					clearWorkoutDraft();
					showPage("new-workout-page");
					setupNewWorkout();
					wireDraftAutosave();
				};

				openModal(modalMessages.continueWorkout(workoutName, continueAction, startNewAction));
				return; // stop default flow
			}
			// No draft -> proceed with a fresh workout
			showPage("new-workout-page");
			setupNewWorkout();
			wireDraftAutosave();
		});
	}

	// Add exercise button
	if (ADD_EXERCISE_BUTTON) {
		ADD_EXERCISE_BUTTON.addEventListener("click", () => {
			// Add a new exercise form
			if (EXERCISE_FORM_CONTAINER) {
				EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm());
				scrollToExercise("last");
			}
			// Save draft immediately when adding a new exercise block
			saveWorkoutDraft();
		});
	}

	// Show one empty exercise form if none exist
	if (EXERCISE_FORM_CONTAINER && EXERCISE_FORM_CONTAINER.childElementCount === 0) {
		EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm());
	}

	// Back button: return to dashboard
	if (BACK_BUTTON_WORKOUT) {
		BACK_BUTTON_WORKOUT.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default action (form submission)

			// If we're in edit mode, reset the form to the original workout data and return to history
			if (isInEditMode()) {
				openModal({
					...modalMessages.discardChanges(),
					onPrimary: () => {
						showPage("history-page");
						// reset edit data AFTER returning to history page, to not trigger draft save from leaving the page
						setEditData(null);
					},
				});
			} else {
				// Normal behavior: go back to the dashboard
				showPage("workout-dashboard-page");
			}
		});
	}

	// Finish button: build the workout from the form and save it to localStorage
	if (FINISH_WORKOUT_BUTTON) {
		FINISH_WORKOUT_BUTTON.addEventListener("click", () => {
			// if we're in edit mode, update the original workout
			if (isInEditMode()) {
				saveEditedWorkout();
			} else {
				saveNewWorkout();
			}
		});
	}

	// Set up event listeners
	if (PREV_EXERCISE_BUTTON) {
		PREV_EXERCISE_BUTTON.addEventListener("click", () => scrollToExercise("prev"));
	}

	if (NEXT_EXERCISE_BUTTON) {
		NEXT_EXERCISE_BUTTON.addEventListener("click", () => scrollToExercise("next"));
	}

	// check for scroll end and update scroll buttons
	EXERCISE_FORM_CONTAINER?.addEventListener("scrollend", () => updateScrollButtons());

	// wire up the navigation buttons
	wireNavButtons();

	// Set the schema version in the UI
	const schemaVersionEl = document.getElementById("current-schema-version") as HTMLDivElement;
	if (schemaVersionEl) {
		schemaVersionEl.textContent = String(SCHEMA_VERSION);
	}
}
