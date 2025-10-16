// import all the functions and variables we need from other files
import { modalMessages, openModal } from './modal.js';
import { getCurrentWorkout, WORKOUT_DRAFT_KEY } from './data-storage.js';
import { createExerciseForm } from './workout-builder.js';
import { formatDisplayDate } from './utils.js';
import { WORKOUT_NAME_INPUT, WORKOUT_DATE_TEXT, EXERCISE_FORM_CONTAINER, MODAL_BG_OVERLAY } from './constants.js';
import { isInEditMode } from './history.js';
// read the current draft from the form and return it as a JSON object
export function createWorkoutDraftData() {
    // Converts a string to a number, to allow 0 as a valid value instead of empty string/null
    function convertToNumber(inputValue) {
        // Return null if the input is empty, undefined, or null
        if (inputValue === '' || inputValue === undefined || inputValue === null) {
            return null;
        }
        // Convert the string to a number
        const numberValue = Number(inputValue);
        // Return the number if it's valid, otherwise return null
        return Number.isNaN(numberValue) ? null : numberValue;
    }
    const exerciseForms = EXERCISE_FORM_CONTAINER ? [...EXERCISE_FORM_CONTAINER.querySelectorAll('.add-exercise-form')] : [];
    const draftData = exerciseForms.map((exerciseData) => {
        var _a;
        const EXERCISE_NAME_INPUT = exerciseData.querySelector('.exercise-name');
        const EXERCISE_NOTES_INPUT = exerciseData.querySelector('.exercise-notes');
        const EXERCISE_DIFFICULTY = exerciseData.querySelector('.exercise-difficulty');
        const name = ((EXERCISE_NAME_INPUT === null || EXERCISE_NAME_INPUT === void 0 ? void 0 : EXERCISE_NAME_INPUT.value) || '').trim();
        const notes = ((EXERCISE_NOTES_INPUT === null || EXERCISE_NOTES_INPUT === void 0 ? void 0 : EXERCISE_NOTES_INPUT.value) || '').trim();
        const difficulty = ((_a = EXERCISE_DIFFICULTY === null || EXERCISE_DIFFICULTY === void 0 ? void 0 : EXERCISE_DIFFICULTY.selectedOptions[0]) === null || _a === void 0 ? void 0 : _a.text) || '';
        const sets = [...exerciseData.querySelectorAll('.set-row')].map((row) => {
            const WEIGHT_INPUT = row.querySelector('.set-weight');
            const REPS_INPUT = row.querySelector('.set-reps');
            const weight = convertToNumber(WEIGHT_INPUT === null || WEIGHT_INPUT === void 0 ? void 0 : WEIGHT_INPUT.value);
            const reps = convertToNumber(REPS_INPUT === null || REPS_INPUT === void 0 ? void 0 : REPS_INPUT.value);
            return { weight, reps };
        });
        return { name, notes, difficulty, sets };
    });
    return {
        name: (WORKOUT_NAME_INPUT === null || WORKOUT_NAME_INPUT === void 0 ? void 0 : WORKOUT_NAME_INPUT.value) || '',
        date: (WORKOUT_DATE_TEXT === null || WORKOUT_DATE_TEXT === void 0 ? void 0 : WORKOUT_DATE_TEXT.textContent) || '',
        exercises: draftData
    };
}
// Applies a draft to the form
export function applyWorkoutDraft(draft) {
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
    // apply name and date to the html
    WORKOUT_NAME_INPUT && (WORKOUT_NAME_INPUT.value = draft.name || '');
    WORKOUT_DATE_TEXT && (WORKOUT_DATE_TEXT.textContent = draft.date || WORKOUT_DATE_TEXT.textContent || '');
    // if no container, return
    if (!EXERCISE_FORM_CONTAINER)
        return;
    // clear the container
    EXERCISE_FORM_CONTAINER.innerHTML = '';
    // check if exercises is an array and has length, if not, use an empty array
    const exercisesToLoad = Array.isArray(draft.exercises) && draft.exercises.length
        ? draft.exercises
        : [{ name: '', notes: '', difficulty: '', sets: [{ weight: 0, reps: 0 }] }];
    // loop through the exercises and create forms for them
    exercisesToLoad.forEach((exerciseData) => {
        EXERCISE_FORM_CONTAINER === null || EXERCISE_FORM_CONTAINER === void 0 ? void 0 : EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm({
            name: exerciseData.name || '',
            notes: exerciseData.notes || '',
            difficulty: exerciseData.difficulty || '',
            sets: (exerciseData.sets || []).map(set => ({
                weight: set.weight !== null && set.weight !== undefined
                    ? String(set.weight)
                    : '',
                reps: set.reps ? String(set.reps) : ''
            }))
        }));
    });
}
// load the draft from localStorage
export const loadWorkoutDraft = () => {
    try {
        // Get the draft from localStorage
        return JSON.parse(localStorage.getItem(WORKOUT_DRAFT_KEY) || 'null');
    }
    catch (_) {
        // If there's an error, return null
        return null;
    }
};
// Save the draft to localStorage
export const saveDraftDataToStorage = (draft) => {
    try {
        // If the draft is an object, save it to localStorage
        if (draft && typeof draft === 'object') {
            localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
        }
    }
    catch (_) {
        // Ignore any errors
    }
};
// Saves the current draft to localStorage
export function saveWorkoutDraft() {
    // if we're in edit mode, don't save the draft
    if (isInEditMode())
        return;
    const draft = createWorkoutDraftData();
    saveDraftDataToStorage(draft);
}
// Clear the draft from localStorage
export const clearWorkoutDraft = () => {
    try {
        localStorage.removeItem(WORKOUT_DRAFT_KEY);
    }
    catch (_) {
        // Ignore any errors
    }
};
// Sets up autosave listeners
export function wireDraftAutosave() {
    // Save when the document is hidden (tab switch, app background)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveWorkoutDraft();
        }
    });
    // Save right before the page unloads (refresh, close, back)
    window.addEventListener('beforeunload', () => {
        saveWorkoutDraft();
    });
    // Listen for custom request to save the draft (e.g., from remove-set)
    document.addEventListener('draft-save-request', () => {
        saveWorkoutDraft();
    });
}
// Opens a modal to ask the user whether to continue editing the last workout or start a new one
export function openDraftModal({ clickedContinue, clickedDiscard }) {
    var _a;
    // check whether the discard action was explicitly triggered, in case of backdrop click
    let explicitDiscard = false;
    const handleDiscard = () => {
        explicitDiscard = true;
        clickedDiscard();
    };
    // load workout name for the modal message
    const workoutName = ((_a = loadWorkoutDraft()) === null || _a === void 0 ? void 0 : _a.name) || 'the last workout';
    openModal(Object.assign(Object.assign({}, modalMessages.resumeWorkout(clickedContinue, handleDiscard, workoutName)), { 
        // Prevents backdrop click from triggering secondary action
        onBackdropClick: () => {
            if (MODAL_BG_OVERLAY) {
                MODAL_BG_OVERLAY.hidden = true;
                MODAL_BG_OVERLAY.setAttribute('aria-hidden', 'true');
            }
        } }));
}
//# sourceMappingURL=draft.js.map