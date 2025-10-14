// import all the functions and variables we need from other files
import { showPage, wireNavButtons } from './nav.js';
import { createExerciseForm, readExercisesFromForms } from './workout-builder.js';
import { loadAllExerciseNames, saveAllExerciseNames, loadAllWorkouts, saveAllWorkouts, setupNewWorkout, getCurrentWorkout, populateExerciseDatalist, validateWorkoutData } from './data-storage.js';
import { updateLastWorkoutSummary, renderHistory } from './history.js';
import { openModal } from './modal.js';
import { openDraftModal, saveWorkoutDraft, applyWorkoutDraft, wireDraftAutosave, clearWorkoutDraft, loadWorkoutDraft } from './draft.js';
import { Exercise, ExerciseSet } from './types.js';
import { SCHEMA_VERSION } from './migration.js';
import { START_WORKOUT_BUTTON, ADD_EXERCISE_BUTTON, EXERCISE_FORM_CONTAINER, BACK_BUTTON_WORKOUT, FINISH_WORKOUT_BUTTON, WORKOUT_NAME_INPUT, WORKOUT_DATE_TEXT } from './constants.js';

// Wire up all the UI events
export function wireUiEvents() {
  // Start workout button
  START_WORKOUT_BUTTON && START_WORKOUT_BUTTON.addEventListener('click', () => {
    // Initialize a new workout
    setupNewWorkout();
    // Check if there's a draft that has data
    const draft = loadWorkoutDraft();
    const hasDraft = !!(
      draft &&
      // Check if the draft has a name or exercises or sets
      ((draft.name && draft.name.trim()) ||
        (draft.exercises &&
          draft.exercises.some(
            (ex: Exercise) =>
              (ex.name && ex.name.trim()) ||
              (ex.notes && ex.notes.trim()) ||
              (ex.sets &&
                ex.sets.some(
                  (s: ExerciseSet) =>
                    String(s.weight || "").trim() || String(s.reps || "").trim()
                ))
          )))
    );

    // If there's a draft, show the draft modal
    if (hasDraft) {
      openDraftModal({
        // Continue: load workout page, apply draft, and wire draft autosave
        clickedContinue: () => {
          showPage('new-workout-page');
          applyWorkoutDraft(draft);
          wireDraftAutosave();
        },
        // Start New: clear draft, load workout page, and wire draft autosave
        clickedDiscard: () => {
          clearWorkoutDraft();
          showPage('new-workout-page');
          setupNewWorkout();
          wireDraftAutosave();
        }
      });
      return; // stop default flow
    }
    // No draft -> proceed with a fresh workout
    showPage('new-workout-page');
    setupNewWorkout();
    wireDraftAutosave();
  });

  // Add exercise button
  ADD_EXERCISE_BUTTON && ADD_EXERCISE_BUTTON.addEventListener('click', () => {
    // Add a new exercise form
    EXERCISE_FORM_CONTAINER && EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm());
    // Save draft immediately when adding a new exercise block
    saveWorkoutDraft();
  });

  // Show one empty exercise form if none exist
  EXERCISE_FORM_CONTAINER &&
    EXERCISE_FORM_CONTAINER.childElementCount === 0 &&
    EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm());

  // Back button: return to dashboard
  BACK_BUTTON_WORKOUT && BACK_BUTTON_WORKOUT.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default action (form submission)
    showPage('workout-dashboard-page');
  });

  // Finish button: build the workout from the form and save it to localStorage
  FINISH_WORKOUT_BUTTON && FINISH_WORKOUT_BUTTON.addEventListener('click', () => {
    // Get current workout data
    const currentWorkout = getCurrentWorkout();
    if (!currentWorkout) {
      return;
    }
    // Update workout name and date if they've changed
    WORKOUT_NAME_INPUT &&
      (currentWorkout.name =
        WORKOUT_NAME_INPUT.value.trim() || currentWorkout.name);
    WORKOUT_DATE_TEXT &&
      (currentWorkout.date =
        WORKOUT_DATE_TEXT.textContent || currentWorkout.date);

    // Get exercises from forms
    currentWorkout.exercises = readExercisesFromForms();

    // Validate the workout data
    if (!validateWorkoutData()) {
      return;
    }

    // Save exercise names for autocomplete
    const exerciseNames = new Set(loadAllExerciseNames());
    // Add all unique exercise names to a set
    currentWorkout.exercises.forEach((ex: Exercise) => {
      // if not empty, add trimmed name to the set
      (ex.name) && exerciseNames.add(ex.name.trim());
    });
    // Save the set to localStorage in an array sorted alphabetically 
    saveAllExerciseNames([...exerciseNames].sort());
    populateExerciseDatalist();

    // Add the workout to localStorage
    const allWorkouts = loadAllWorkouts();
    allWorkouts.push(currentWorkout);
    saveAllWorkouts(allWorkouts);

    // Clear any saved draft since we've just saved the workout
    clearWorkoutDraft();

    // Update the last workout summary on the dashboard
    updateLastWorkoutSummary();
    // Refresh the history page to show the new workout
    renderHistory();
    // Display a success message
    openModal({
      title: "Workout saved",
      message: `Your workout "${currentWorkout.name}" has been saved.`,
    });
    // Redirect to the history page
    showPage("history-page");
    // Reset the form to a blank state in background and clear the draft
    setupNewWorkout();
    clearWorkoutDraft();
  });

  // wire up the navigation buttons
  wireNavButtons();

  // Set the schema version in the UI
  const schemaVersionEl = document.getElementById('current-schema-version') as HTMLDivElement;
  if (schemaVersionEl) {
    schemaVersionEl.textContent = String(SCHEMA_VERSION);
  }
}