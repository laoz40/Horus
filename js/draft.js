// import all the functions and variables we need from other files
import { openAppModal } from './modal.js';
import { loadWorkoutDraft, saveWorkoutDraft } from './data-storage.js';
import { createExerciseForm } from './workout-builder.js';

// read the current draft from the form and return it as a JSON object
export function serializeDraft() {
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

// Applies a draft to the form
export function applyDraft(draft) {
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

// Restores the draft if any
export function restoreDraftIfAny() {
  const draft = loadWorkoutDraft();
  if (draft) {
    applyDraft(draft);
  }
}

// Saves the current draft to localStorage
export function saveDraftNow() {
  const draft = serializeDraft();
  saveWorkoutDraft(draft);
}

// Sets up autosave listeners
export function wireDraftAutosave() {
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

// Opens a modal to ask the user whether to continue editing the last workout or start a new one
export function openDraftModal({ onContinue, onDiscard }) {
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