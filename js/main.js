// import all the functions and variables we need from other files
import { SCHEMA_VERSION, loadAllExerciseNames, saveAllExerciseNames, loadAllWorkouts, saveAllWorkouts, runMigrations, WORKOUTS_KEY, populateExerciseDatalist, initNewWorkout, getCurrentWorkout, loadWorkoutDraft, saveWorkoutDraft, clearWorkoutDraft } from './data-storage.js';
import { createExerciseForm, readExercisesFromForms } from './add-exercise.js';
import { updateLastWorkoutSummary, renderHistory } from './history.js';
import { showPage, wireNavButtons } from './nav.js';
import { openAppModal } from './modal.js';


// When the page is ready, wire buttons, show the home page, and set up events.
document.addEventListener('DOMContentLoaded', () => {
  showPage('workout-dashboard-page');
  wireNavButtons();
  
  // Set the schema version in the UI
  const schemaVersionEl = document.getElementById('current-schema-version');
  if (schemaVersionEl) {
    schemaVersionEl.textContent = SCHEMA_VERSION;
  }

  // Start workout button
  const startWorkoutBtn = document.getElementById('start-workout-btn');
  startWorkoutBtn && startWorkoutBtn.addEventListener('click', () => {
    const draft = loadWorkoutDraft();
    const hasDraft = !!(draft && (
      (draft.name && draft.name.trim()) ||
      (draft.exercises && draft.exercises.some(ex => (
        (ex.name && ex.name.trim()) ||
        (ex.notes && ex.notes.trim()) ||
        (ex.sets && ex.sets.some(s => (String(s.weight||'').trim() || String(s.reps||'').trim())))
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
  
  // Show one empty exercise form when page loads
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

  // Start with a fresh workout when the app opens
  // initNewWorkout();

  // Always wire visibility/unload based autosave once
  wireDraftAutosave();

  // Save the draft when navigating away from the New Workout page
  document.addEventListener('page-will-hide', (e) => {
    const fromId = e?.detail?.pageId;
    if (fromId === 'new-workout-page') {
      saveDraftNow();
    }
  });

  // Restore the draft when showing the New Workout page
  document.addEventListener('page-did-show', (e) => {
    const toId = e?.detail?.pageId;
    if (toId === 'new-workout-page') {
      restoreDraftIfAny();
    }
  });
});

// -----------------------
// Workout Draft Persistence
// -----------------------

function serializeDraft() {
  const workoutNameInput = document.getElementById('workout-name');
  const workoutDateEl = document.getElementById('workout-date');
  const container = document.getElementById('add-exercise-form');
  const forms = container ? [...container.querySelectorAll('.add-exercise-form')] : [];
  const exercises = forms.map((form) => {
    const name = (form.querySelector('.exercise-name')?.value || '').trim();
    const notes = (form.querySelector('.exercise-notes')?.value || '').trim();
    const diffSelect = form.querySelector('.exercise-difficulty');
    const difficulty = diffSelect?.value ? diffSelect.options[diffSelect.selectedIndex].text : '';
    const sets = [...form.querySelectorAll('.set-row')].map((row) => {
      const weight = (row.querySelector('.set-weight')?.value || '').toString();
      const reps = (row.querySelector('.set-reps')?.value || '').toString();
      return { weight, reps };
    });
    return { name, notes, difficulty, sets };
  });
  return {
    name: workoutNameInput ? workoutNameInput.value : '',
    date: workoutDateEl ? workoutDateEl.textContent : '',
    exercises
  };
}

function applyDraft(draft) {
  if (!draft || typeof draft !== 'object') return;
  const workoutNameInput = document.getElementById('workout-name');
  const workoutDateEl = document.getElementById('workout-date');
  workoutNameInput && (workoutNameInput.value = draft.name || '');
  workoutDateEl && (workoutDateEl.textContent = draft.date || workoutDateEl.textContent || '');

  const container = document.getElementById('add-exercise-form');
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(draft.exercises) && draft.exercises.length ? draft.exercises : [{}];
  list.forEach((ex) => {
    container.appendChild(createExerciseForm({
      name: ex.name || '',
      notes: ex.notes || '',
      difficulty: ex.difficulty || '',
      sets: Array.isArray(ex.sets) && ex.sets.length ? ex.sets : [{ weight: '', reps: '' }]
    }));
  });
}

function restoreDraftIfAny() {
  const draft = loadWorkoutDraft();
  if (draft) {
    applyDraft(draft);
  }
}

function saveDraftNow() {
  const draft = serializeDraft();
  saveWorkoutDraft(draft);
}

function wireDraftAutosave() {
  // Save when the document is hidden (tab switch, app background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveDraftNow();
    }
  });

  // Save right before the page unloads (refresh, close, back)
  window.addEventListener('beforeunload', () => {
    saveDraftNow();
  });

  // Listen for custom requests to save the draft (e.g., from remove-set)
  document.addEventListener('draft-save-request', () => {
    saveDraftNow();
  });
}

// -----------------------
// In-app Draft Modal
// -----------------------
function openDraftModal({ onContinue, onDiscard }) {
  // Create a wrapper for the discard action to track if it was explicitly triggered
  let explicitDiscard = false;
  const handleDiscard = () => {
    explicitDiscard = true;
    onDiscard();
  };

  openAppModal({
    title: 'Resume last workout?',
    message: 'Do you want to continue editing the last workout or start a new one?',
    primaryText: 'Continue',
    secondaryText: 'Start New',
    onPrimary: onContinue,
    onSecondary: handleDiscard,
    // When clicking outside, just close the modal without triggering any action
    onBackdropClick: () => {
      const overlay = document.getElementById('app-modal-overlay');
      if (overlay) {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      }
    },
    dismissOnBackdrop: true,
    dismissOnEsc: true
  });
}
