// import all the functions and variables we need from other files
import { showPage, wireNavButtons } from './nav.js';
import { createExerciseForm, readExercisesFromForms } from './workout-builder.js';
import { loadAllExerciseNames, saveAllExerciseNames, loadAllWorkouts, saveAllWorkouts, initNewWorkout, getCurrentWorkout, clearWorkoutDraft, populateExerciseDatalist, loadWorkoutDraft, SCHEMA_VERSION } from './data-storage.js';
import { updateLastWorkoutSummary, renderHistory } from './history.js';
import { openAppModal } from './modal.js';
import { openDraftModal, saveDraftNow, applyDraft, wireDraftAutosave } from './draft.js';


export function wireUiEvents() {
  // Start workout button
  const startWorkoutBtn = document.getElementById('start-workout-btn');
  startWorkoutBtn && startWorkoutBtn.addEventListener('click', () => {
    const draft = loadWorkoutDraft();
    const hasDraft = !!(draft && (
      (draft.name && draft.name.trim()) ||
      (draft.exercises && draft.exercises.some(ex => (
        (ex.name && ex.name.trim()) ||
        (ex.notes && ex.notes.trim()) ||
        (ex.sets && ex.sets.some(s => (String(s.weight || '').trim() || String(s.reps || '').trim())))
      )))
    ));

    if (hasDraft) {
      openDraftModal({
        onContinue: () => {
          showPage('new-workout-page');
          initNewWorkout();
          applyDraft(draft);
          wireDraftAutosave();
        },
        onDiscard: () => {
          clearWorkoutDraft();
          showPage('new-workout-page');
          initNewWorkout();
          wireDraftAutosave();
        }
      });
      return; // stop default flow
    }
    // No draft -> proceed with a fresh workout
    showPage('new-workout-page');
    initNewWorkout();
    wireDraftAutosave();
  });

  // Add exercise form when you click "Add Exercise"
  const addExerciseBtn = document.getElementById('add-exercise-btn');
  const exerciseFormsContainer = document.getElementById('add-exercise-form');
  addExerciseBtn && addExerciseBtn.addEventListener('click', () => {
    exerciseFormsContainer && exerciseFormsContainer.appendChild(createExerciseForm());
    // Save immediately after adding a new exercise block
    saveDraftNow();
  });

  // Show one empty exercise form if none exist
  exerciseFormsContainer && exerciseFormsContainer.childElementCount === 0 && exerciseFormsContainer.appendChild(createExerciseForm());

  // Back button: return to dashboard
  const backButtonWorkout = document.getElementById('workout-back-btn');
  backButtonWorkout && backButtonWorkout.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default action (form submission)
    showPage('workout-dashboard-page');
  });

  // Finish button: build the workout from the form and save it to localStorage
  const finishWorkoutBtn = document.getElementById('finish-workout-btn');
  finishWorkoutBtn && finishWorkoutBtn.addEventListener('click', () => {
    const currentWorkout = getCurrentWorkout(); // Get the current workout data
    if (!currentWorkout) { // If no workout exists, show error and stop
      openAppModal({
        title: 'Cannot save',
        message: 'No active workout to save.'
      });
      return;
    }
    const workoutNameInput = document.getElementById('workout-name');
    const workoutDateEl = document.getElementById('workout-date');
    // If the workout name or date are different, update them
    workoutNameInput && (currentWorkout.name = workoutNameInput.value.trim() || currentWorkout.name);
    workoutDateEl && (currentWorkout.date = workoutDateEl.textContent || currentWorkout.date);

    // Get exercises from forms
    currentWorkout.exercises = readExercisesFromForms();
    // If no exercises, show error and stop
    if (!currentWorkout.exercises.length) {
      openAppModal({
        title: 'Incomplete workout',
        message: 'Add at least one exercise before finishing the workout.'
      });
      return;
    }

    // Save exercise names for autocomplete
    const names = new Set(loadAllExerciseNames());
    // Add all exercise names to the set
    currentWorkout.exercises.forEach(ex => { if (ex.name) names.add(ex.name.trim()); });
    // Save the set to localStorage
    saveAllExerciseNames([...names].sort());
    populateExerciseDatalist();

    // Add the workout to localStorage
    const workouts = loadAllWorkouts();
    workouts.push(currentWorkout);
    saveAllWorkouts(workouts);

    // Clear any saved draft since we've just saved the workout
    clearWorkoutDraft();

    // Update the last workout summary
    updateLastWorkoutSummary();
    // Render the history page
    renderHistory();
    // Show a success message (non-blocking)
    openAppModal({
      title: 'Workout saved',
      message: 'Your workout has been saved.'
    });
    // Show the history page
    showPage('history-page');
    // Reset the form
    initNewWorkout();
  });

  // wire up the navigation buttons
  wireNavButtons();

  // Set the schema version in the UI
  const schemaVersionEl = document.getElementById('current-schema-version');
  if (schemaVersionEl) {
    schemaVersionEl.textContent = SCHEMA_VERSION;
  }
}