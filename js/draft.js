// import all the functions and variables we need from other files
import { openAppModal } from './modal.js';
import { saveWorkoutDraft } from './data-storage.js';
import { createExerciseForm } from './workout-builder.js';

const workoutNameInput = document.getElementById('workout-name');
const workoutDateText = document.getElementById('workout-date');

// read the current draft from the form and return it as a JSON object
export function serializeDraft() {
  const exerciseFormContainer = document.getElementById('add-exercise-form');
  const exerciseForms = exerciseFormContainer ? [...exerciseFormContainer.querySelectorAll('.add-exercise-form')] : [];
  const draftData = exerciseForms.map((exerciseData) => {
    const name = (exerciseData.querySelector('.exercise-name')?.value || '').trim();
    const notes = (exerciseData.querySelector('.exercise-notes')?.value || '').trim();
    const diffSelect = exerciseData.querySelector('.exercise-difficulty');
    const difficulty = diffSelect?.value ? diffSelect.options[diffSelect.selectedIndex].text : '';
    const sets = [...exerciseData.querySelectorAll('.set-row')].map((row) => {
      const weight = (row.querySelector('.set-weight')?.value || '').toString();
      const reps = (row.querySelector('.set-reps')?.value || '').toString();
      return { weight, reps };
    });
    return { name, notes, difficulty, sets };
  });
  return {
    name: workoutNameInput ? workoutNameInput.value : '',
    date: workoutDateText ? workoutDateText.textContent : '',
    exercises: draftData
  };
}

// Applies a draft to the form
export function applyDraft(draft) {
  // if draft is not an object, return
  if (!draft || typeof draft !== 'object') return;
  // apply name and date
  workoutNameInput && (workoutNameInput.value = draft.name || '');
  workoutDateText && (workoutDateText.textContent = draft.date || workoutDateText.textContent || '');

  const exerciseFormContainer = document.getElementById('add-exercise-form');
  // if no container, return
  if (!exerciseFormContainer) return;
  
  // clear the container
  exerciseFormContainer.innerHTML = '';
  
  // check if exercises is an array and has length, if not, use an empty array
  const exercisesToLoad =
    Array.isArray(draft.exercises) && draft.exercises.length
      ? draft.exercises
      : [{}];
  
  // loop through the exercises and create forms for them
  exercisesToLoad.forEach((exerciseData) => {
    exerciseFormContainer.appendChild(createExerciseForm({
      name: exerciseData.name || '',
      notes: exerciseData.notes || '',
      difficulty: exerciseData.difficulty || '',
      sets: Array.isArray(exerciseData.sets) && exerciseData.sets.length 
        ? exerciseData.sets 
        : [{ weight: '', reps: '' }]
    }));
  });
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

  // Listen for custom request to save the draft (e.g., from remove-set)
  document.addEventListener('draft-save-request', () => {
    saveDraftNow();
  });
}

// Opens a modal to ask the user whether to continue editing the last workout or start a new one
export function openDraftModal({ clickedContinue, clickedDiscard }) {
  // check whether the discard action was explicitly triggered, in case of backdrop click
  let explicitDiscard = false;
  const handleDiscard = () => {
    explicitDiscard = true;
    clickedDiscard();
  };

  openAppModal({
    title: 'Resume last workout?',
    message: 'Do you want to continue editing the last workout or start a new one?',
    primaryText: 'Continue',
    secondaryText: 'Start New',
    onPrimary: clickedContinue,
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