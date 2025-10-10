// import all the functions and variables we need from other files
import { showPage, wireNavButtons } from './nav.js';
import { createExerciseForm, readExercisesFromForms } from './workout-builder.js';
import { loadAllExerciseNames, saveAllExerciseNames, loadAllWorkouts, saveAllWorkouts, setupNewWorkout, getCurrentWorkout, clearWorkoutDraft, populateExerciseDatalist, loadWorkoutDraft, SCHEMA_VERSION } from './data-storage.js';
import { updateLastWorkoutSummary, renderHistory } from './history.js';
import { openAppModal } from './modal.js';
import { openDraftModal, saveDraftNow, applyDraft, wireDraftAutosave } from './draft.js';
import { Exercise, ExerciseSet } from './types.js';

// Wire up all the UI events
export function wireUiEvents() {
  // Start workout button
  const startWorkoutBtn = document.getElementById('start-workout-btn');
  startWorkoutBtn && startWorkoutBtn.addEventListener('click', () => {
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
          applyDraft(draft);
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
  const addExerciseBtn = document.getElementById('add-exercise-btn');
  const exerciseFormsContainer = document.getElementById('add-exercise-form');
  addExerciseBtn && addExerciseBtn.addEventListener('click', () => {
    // Add a new exercise form
    exerciseFormsContainer && exerciseFormsContainer.appendChild(createExerciseForm());
    // Save draft immediately when adding a new exercise block
    saveDraftNow();
  });

  // Show one empty exercise form if none exist
  exerciseFormsContainer &&
    exerciseFormsContainer.childElementCount === 0 &&
    exerciseFormsContainer.appendChild(createExerciseForm());

  // Back button: return to dashboard
  const backButtonWorkout = document.getElementById('workout-back-btn');
  backButtonWorkout && backButtonWorkout.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default action (form submission)
    showPage('workout-dashboard-page');
  });

  // Finish button: build the workout from the form and save it to localStorage
  const finishWorkoutBtn = document.getElementById('finish-workout-btn');
  finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
    // Get current workout data
    const currentWorkout = getCurrentWorkout();
    // If no workout exists, show error and stop
    if (!currentWorkout) {
      openAppModal({
        title: "Cannot save",
        message: "No active workout to save.",
      });
      return;
    }
    const workoutNameInput = document.getElementById("workout-name") as HTMLInputElement;
    const workoutDateText = document.getElementById("workout-date") as HTMLInputElement;
    // Update workout name and date if they've changed
    workoutNameInput &&
      (currentWorkout.name =
        workoutNameInput.value.trim() || currentWorkout.name);
    workoutDateText &&
      (currentWorkout.date =
        workoutDateText.textContent || currentWorkout.date);

    // Get exercises from forms
    currentWorkout.exercises = readExercisesFromForms();
    // If no exercises, show error and stop
    if (!currentWorkout.exercises.length) {
      openAppModal({
        title: "Incomplete workout",
        message: "Add at least one exercise before finishing the workout.",
      });
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
    openAppModal({
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