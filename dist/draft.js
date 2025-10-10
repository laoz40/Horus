// import all the functions and variables we need from other files
import { openAppModal } from './modal.js';
import { saveWorkoutDraft, getCurrentWorkout } from './data-storage.js';
import { createExerciseForm } from './workout-builder.js';
import { formatDisplayDate } from './utils.js';
const workoutNameInput = document.getElementById('workout-name');
const workoutDateText = document.getElementById('workout-date');
// read the current draft from the form and return it as a JSON object
export function serializeDraft() {
    const exerciseFormContainer = document.getElementById('add-exercise-form');
    const exerciseForms = exerciseFormContainer ? [...exerciseFormContainer.querySelectorAll('.add-exercise-form')] : [];
    const draftData = exerciseForms.map((exerciseData) => {
        var _a;
        const nameInput = exerciseData.querySelector('.exercise-name');
        const notesInput = exerciseData.querySelector('.exercise-notes');
        const diffSelect = exerciseData.querySelector('.exercise-difficulty');
        const name = ((nameInput === null || nameInput === void 0 ? void 0 : nameInput.value) || '').trim();
        const notes = ((notesInput === null || notesInput === void 0 ? void 0 : notesInput.value) || '').trim();
        const difficulty = ((_a = diffSelect === null || diffSelect === void 0 ? void 0 : diffSelect.selectedOptions[0]) === null || _a === void 0 ? void 0 : _a.text) || '';
        const sets = [...exerciseData.querySelectorAll('.set-row')].map((row) => {
            const weightInput = row.querySelector('.set-weight');
            const repsInput = row.querySelector('.set-reps');
            const weight = parseFloat((weightInput === null || weightInput === void 0 ? void 0 : weightInput.value) || '0') || 0;
            const reps = parseInt((repsInput === null || repsInput === void 0 ? void 0 : repsInput.value) || '0', 10) || 0;
            return { weight, reps };
        });
        return { name, notes, difficulty, sets };
    });
    return {
        name: (workoutNameInput === null || workoutNameInput === void 0 ? void 0 : workoutNameInput.value) || '',
        date: (workoutDateText === null || workoutDateText === void 0 ? void 0 : workoutDateText.textContent) || '',
        exercises: draftData
    };
}
// Applies a draft to the form
export function applyDraft(draft) {
    // if draft is not an object, return
    if (!draft || typeof draft !== 'object')
        return;
    // Get current date for the draft
    const today = new Date();
    const displayDate = formatDisplayDate(today);
    // Update name and date in currentWorkout data
    const currentWorkout = getCurrentWorkout();
    if (!currentWorkout)
        return;
    currentWorkout.name = draft.name || '';
    currentWorkout.date = displayDate;
    // apply name and date
    workoutNameInput && (workoutNameInput.value = draft.name || '');
    workoutDateText && (workoutDateText.textContent = draft.date || workoutDateText.textContent || '');
    // apply exercises
    const exerciseFormContainer = document.getElementById('add-exercise-form');
    // if no container, return
    if (!exerciseFormContainer)
        return;
    // clear the container
    exerciseFormContainer.innerHTML = '';
    // check if exercises is an array and has length, if not, use an empty array
    const exercisesToLoad = Array.isArray(draft.exercises) && draft.exercises.length
        ? draft.exercises
        : [{ name: '', notes: '', difficulty: '', sets: [{ weight: 0, reps: 0 }] }];
    // loop through the exercises and create forms for them
    exercisesToLoad.forEach((exerciseData) => {
        exerciseFormContainer.appendChild(createExerciseForm({
            name: exerciseData.name || '',
            notes: exerciseData.notes || '',
            difficulty: exerciseData.difficulty || '',
            sets: (exerciseData.sets || []).map(set => {
                var _a, _b;
                return ({
                    weight: Number((_a = set.weight) !== null && _a !== void 0 ? _a : 0),
                    reps: Number((_b = set.reps) !== null && _b !== void 0 ? _b : 0)
                });
            })
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
//# sourceMappingURL=draft.js.map