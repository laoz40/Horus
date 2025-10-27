// Nav
export const NAV_ELEMENT = document.querySelector("nav");
export const NAV_BUTTONS = document.querySelectorAll<HTMLElement>("nav .nav-button");

// Dashboard page elements
export const START_WORKOUT_BUTTON = document.getElementById(
	"start-workout-btn"
) as HTMLButtonElement | null;
export const LAST_WORKOUT_SUMMARY = document.getElementById(
	"last-workout-summary"
) as HTMLElement | null;

// Workout page elements
export const WORKOUT_NAME_INPUT = document.getElementById(
	"workout-name"
) as HTMLInputElement | null;
export const WORKOUT_DATE_TEXT = document.getElementById("workout-date") as HTMLElement | null;
export const EXERCISE_FORM_CONTAINER = document.getElementById(
	"exercise-form-container"
) as HTMLElement | null;
export const BACK_BUTTON_WORKOUT = document.getElementById(
	"workout-back-btn"
) as HTMLButtonElement | null;
export const FINISH_WORKOUT_BUTTON = document.getElementById(
	"finish-workout-btn"
) as HTMLButtonElement | null;
export const NEXT_EXERCISE_BUTTON = document.getElementById(
	"next-exercise"
) as HTMLButtonElement | null;
export const PREV_EXERCISE_BUTTON = document.getElementById(
	"prev-exercise"
) as HTMLButtonElement | null;

// Exercise form elements
export const ADD_EXERCISE_BUTTON = document.getElementById(
	"add-exercise-btn"
) as HTMLButtonElement | null;
export const EXERCISE_NAME_LIST = document.getElementById(
	"exercise-name-list"
) as HTMLDataListElement | null;

// Modal elements
export const MODAL = document.getElementById("modal") as HTMLDialogElement | null;
export const MODAL_TITLE = document.getElementById("modal-title") as HTMLElement | null;
export const MODAL_MESSAGE = document.getElementById("modal-message") as HTMLElement | null;
export const MODAL_PRIMARY_BUTTON = document.getElementById(
	"modal-primary-btn"
) as HTMLButtonElement | null;
export const MODAL_SECONDARY_BUTTON = document.getElementById(
	"modal-secondary-btn"
) as HTMLButtonElement | null;

// History page elements
export const HISTORY_CONTAINER = document.getElementById(
	"workouts-history-container"
) as HTMLElement | null;

// Settings page elements
export const THEME_TOGGLE = document.getElementById("theme-toggle") as HTMLButtonElement | null;
