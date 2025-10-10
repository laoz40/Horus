// import all the functions and variables we need from other files
import { openAppModal } from './modal.js';
import { saveWorkoutDraft, getCurrentWorkout } from './data-storage.js';
import { createExerciseForm } from './workout-builder.js';
import { Exercise, WorkoutDraft } from './types.js';
import { formatDisplayDate } from './utils.js';

const workoutNameInput = document.getElementById('workout-name');
const workoutDateText = document.getElementById('workout-date');

// read the current draft from the form and return it as a JSON object
export function serializeDraft() {
  const exerciseFormContainer = document.getElementById('add-exercise-form');
  const exerciseForms = exerciseFormContainer ? [...exerciseFormContainer.querySelectorAll('.add-exercise-form')] : [];
  const draftData = exerciseForms.map((exerciseData) => {
    const nameInput = exerciseData.querySelector<HTMLInputElement>('.exercise-name');
    const notesInput = exerciseData.querySelector<HTMLTextAreaElement>('.exercise-notes');
    const diffSelect = exerciseData.querySelector<HTMLSelectElement>('.exercise-difficulty');
    
    const name = (nameInput?.value || '').trim();
    const notes = (notesInput?.value || '').trim();
    const difficulty = diffSelect?.selectedOptions[0]?.text || '';
    
    const sets = [...exerciseData.querySelectorAll('.set-row')].map((row) => {
      const weightInput = row.querySelector<HTMLInputElement>('.set-weight');
      const repsInput = row.querySelector<HTMLInputElement>('.set-reps');
      
      const weight = parseFloat(weightInput?.value || '0') || 0;
      const reps = parseInt(repsInput?.value || '0', 10) || 0;
      return { weight, reps };
    });
    return { name, notes, difficulty, sets };
  });
  return {
    name: (workoutNameInput as HTMLInputElement)?.value || '',
    date: (workoutDateText as HTMLDivElement)?.textContent || '',
    exercises: draftData
  };
}

// Applies a draft to the form
export function applyDraft(draft: WorkoutDraft) {
  // if draft is not an object, return
  if (!draft || typeof draft !== 'object') return;

  // Get current date for the draft
  const today = new Date();
  const displayDate = formatDisplayDate(today);
  // Update name and date in currentWorkout data
  const currentWorkout = getCurrentWorkout();
  if (!currentWorkout) return;
  currentWorkout.name = draft.name || '';
  currentWorkout.date = displayDate;

  // apply name and date
  workoutNameInput && ((workoutNameInput as HTMLInputElement).value = draft.name || '');
  workoutDateText && (workoutDateText.textContent = draft.date || workoutDateText.textContent || '');

  // apply exercises
  const exerciseFormContainer = document.getElementById('add-exercise-form');
  // if no container, return
  if (!exerciseFormContainer) return;
  
  // clear the container
  exerciseFormContainer.innerHTML = '';
  
  // check if exercises is an array and has length, if not, use an empty array
  const exercisesToLoad: Exercise[] =
    Array.isArray(draft.exercises) && draft.exercises.length
      ? draft.exercises
      : [{name: '', notes: '', difficulty: '', sets: [{ weight: 0, reps: 0 }]}];
  
  // loop through the exercises and create forms for them
  exercisesToLoad.forEach((exerciseData) => {
    exerciseFormContainer.appendChild(createExerciseForm({
      name: exerciseData.name || '',
      notes: exerciseData.notes || '',
      difficulty: exerciseData.difficulty || '',
      sets: (exerciseData.sets || []).map(set => ({
        weight: Number(set.weight ?? 0),
        reps: Number(set.reps ?? 0)
      }))
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
export function openDraftModal({ clickedContinue, clickedDiscard }: { clickedContinue: () => void, clickedDiscard: () => void }) {
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