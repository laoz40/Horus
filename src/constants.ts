// Dashboard page elements
export const START_WORKOUT_BUTTON = document.getElementById('start-workout-btn') as HTMLButtonElement | null;
export const LAST_WORKOUT_SUMMARY = document.getElementById('last-workout-summary') as HTMLElement | null;
export const LAST_WORKOUT_SUMMARY_CARD = LAST_WORKOUT_SUMMARY?.querySelector('.workout-summary-card') as HTMLElement | null;

// Workout page elements
export const WORKOUT_NAME_INPUT = document.getElementById('workout-name') as HTMLInputElement | null;
export const WORKOUT_DATE_TEXT = document.getElementById('workout-date') as HTMLElement | null;
export const EXERCISE_FORM_CONTAINER = document.getElementById('add-exercise-form') as HTMLElement | null;
export const BACK_BUTTON_WORKOUT = document.getElementById('workout-back-btn') as HTMLButtonElement | null;
export const FINISH_WORKOUT_BUTTON = document.getElementById('finish-workout-btn') as HTMLButtonElement | null;

// Exercise form elements
export const EXERCISE_NAME_INPUT = document.getElementById('exercise-name') as HTMLInputElement | null;
export const EXERCISE_NOTES_INPUT = document.getElementById('exercise-notes') as HTMLTextAreaElement | null;
export const EXERCISE_DIFFICULTY = document.getElementById('exercise-difficulty') as HTMLSelectElement | null;
export const ADD_EXERCISE_BUTTON = document.getElementById('add-exercise-btn') as HTMLButtonElement | null;
export const EXERCISE_NAME_LIST = document.getElementById('exercise-name-list') as HTMLDataListElement | null;

// Modal elements
export const MODAL_BG_OVERLAY = document.getElementById('app-modal-overlay') as HTMLDivElement | null;
export const MODAL_TITLE = document.getElementById("app-modal-title") as HTMLElement | null;
export const MODAL_MESSAGE = document.getElementById("app-modal-message") as HTMLElement | null;
export const MODAL_PRIMARY_BUTTON = document.getElementById("app-modal-primary-btn") as HTMLButtonElement | null;
export const MODAL_SECONDARY_BUTTON = document.getElementById("app-modal-secondary-btn") as HTMLButtonElement | null;

// History page elements
export const HISTORY_CONTAINER = document.querySelector('.workouts-history') as HTMLElement | null;
export const DELETE_WORKOUT_BUTTON = document.querySelector('.delete-button') as HTMLButtonElement | null;
