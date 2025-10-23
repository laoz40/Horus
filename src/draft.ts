// import all the functions and variables we need from other files
import {
	EXERCISE_FORM_CONTAINER,
	WORKOUT_DATE_TEXT,
	WORKOUT_NAME_INPUT,
} from "./constants.js";
import { getCurrentWorkout, WORKOUT_DRAFT_KEY } from "./data-storage.js";
import { isInEditMode } from "./history.js";
import { modalMessages, openModal } from "./modal.js";
import type { WorkoutDraft } from "./types.js";
import { displayHistoryDate, weekdays } from "./utils.js";
import { createExerciseForm } from "./workout-builder.js";

// read the current draft from the form and return it as a JSON object
export function createWorkoutDraftData(): WorkoutDraft {
	// Converts a string to a number, to allow 0 as a valid value instead of empty string/null
	function convertToNumber(
		inputValue: string | undefined | null,
	): number | null {
		// Return null if the input is empty, undefined, or null
		if (inputValue === "" || inputValue === undefined || inputValue === null) {
			return null;
		}
		// Convert the string to a number
		const numberValue = Number(inputValue);
		// Return the number if it's valid, otherwise return null
		return Number.isNaN(numberValue) ? null : numberValue;
	}

	const exerciseForms = EXERCISE_FORM_CONTAINER
		? [...EXERCISE_FORM_CONTAINER.querySelectorAll(".add-exercise-form")]
		: [];
	const draftData = exerciseForms.map((exerciseData) => {
		const EXERCISE_NAME_INPUT =
			exerciseData.querySelector<HTMLInputElement>(".exercise-name");
		const EXERCISE_NOTES_INPUT =
			exerciseData.querySelector<HTMLTextAreaElement>(".exercise-notes");
		const EXERCISE_DIFFICULTY = exerciseData.querySelector<HTMLSelectElement>(
			".exercise-difficulty",
		);

		const name = (EXERCISE_NAME_INPUT?.value || "").trim();
		const notes = (EXERCISE_NOTES_INPUT?.value || "").trim();
		const difficulty = EXERCISE_DIFFICULTY?.selectedOptions[0]?.text || "";

		const sets = [...exerciseData.querySelectorAll(".set-row")].map((row) => {
			const WEIGHT_INPUT = row.querySelector<HTMLInputElement>(".set-weight");
			const REPS_INPUT = row.querySelector<HTMLInputElement>(".set-reps");

			const weight = convertToNumber(WEIGHT_INPUT?.value);
			const reps = convertToNumber(REPS_INPUT?.value);
			return { weight, reps };
		});
		return { name, notes, difficulty, sets };
	});
	return {
		name: (WORKOUT_NAME_INPUT as HTMLInputElement)?.value || "",
		date: (WORKOUT_DATE_TEXT as HTMLDivElement)?.textContent || "",
		exercises: draftData,
	};
}

// Applies a draft to the form
export function applyWorkoutDraft(draft: WorkoutDraft) {
	// if draft is not an object, return
	if (!draft || typeof draft !== "object") return;

	// Get current date for the draft
	const today = new Date();
	const displayDate = displayHistoryDate(today);
	// Update name and date in currentWorkout data
	const currentWorkout = getCurrentWorkout();
	if (!currentWorkout) return;
	// Only set the name if it exists in the draft, otherwise leave it empty
	currentWorkout.name = draft.name || "";
	currentWorkout.date = displayDate;

	// apply name and date to the html
	if (WORKOUT_NAME_INPUT) {
		if (draft.name) {
			(WORKOUT_NAME_INPUT as HTMLInputElement).value = draft.name;
		} else {
			// Clear the input to show placeholder
			(WORKOUT_NAME_INPUT as HTMLInputElement).value = "";
		}
	}
	if (WORKOUT_DATE_TEXT)
		WORKOUT_DATE_TEXT.textContent =
			draft.date || WORKOUT_DATE_TEXT.textContent || "";

	// if no container, return
	if (!EXERCISE_FORM_CONTAINER) return;
	// clear the container
	EXERCISE_FORM_CONTAINER.innerHTML = "";

	// check if exercises is an array and has length, if not, use an empty array
	const exercisesToLoad =
		Array.isArray(draft.exercises) && draft.exercises.length
			? draft.exercises
			: [
					{
						name: "",
						notes: "",
						difficulty: "",
						sets: [{ weight: 0, reps: 0 }],
					},
				];

	// loop through the exercises and create forms for them
	exercisesToLoad.forEach((exerciseData) => {
		EXERCISE_FORM_CONTAINER?.appendChild(
			createExerciseForm({
				name: exerciseData.name || "",
				notes: exerciseData.notes || "",
				difficulty: exerciseData.difficulty || "",
				sets: (exerciseData.sets || []).map((set) => ({
					weight:
						set.weight !== null && set.weight !== undefined
							? String(set.weight)
							: "",
					reps: set.reps ? String(set.reps) : "",
				})),
			}),
		);
	});
}

// load the draft from localStorage
export const loadWorkoutDraft = () => {
	try {
		// Get the draft from localStorage
		return JSON.parse(localStorage.getItem(WORKOUT_DRAFT_KEY) || "null");
	} catch (_) {
		// If there's an error, return null
		return null;
	}
};

// Save the draft to localStorage
export const saveDraftDataToStorage = (draft: WorkoutDraft | null) => {
	try {
		// If the draft is an object, save it to localStorage
		if (draft && typeof draft === "object") {
			localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
		}
	} catch (_) {
		// Ignore any errors
	}
};

// Saves the current draft to localStorage
export function saveWorkoutDraft() {
	// if we're in edit mode, don't save the draft
	if (isInEditMode()) return;

	const draft = createWorkoutDraftData();
	saveDraftDataToStorage(draft);
}

// Clear the draft from localStorage
export const clearWorkoutDraft = () => {
	try {
		localStorage.removeItem(WORKOUT_DRAFT_KEY);
	} catch (_) {
		// Ignore any errors
	}
};

// Sets up autosave listeners
export function wireDraftAutosave() {
	// Save when the document is hidden (tab switch, app background)
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			saveWorkoutDraft();
		}
	});

	// Save right before the page unloads (refresh, close, back)
	window.addEventListener("beforeunload", () => {
		saveWorkoutDraft();
	});

	// Listen for custom request to save the draft (e.g., from remove-set)
	document.addEventListener("draft-save-request", () => {
		saveWorkoutDraft();
	});
}

// Opens a modal to ask the user whether to continue editing the last workout or start a new one
export function openDraftModal({
	clickedContinue,
	clickedDiscard,
}: {
	clickedContinue: () => void;
	clickedDiscard: () => void;
}) {
	// load workout name for the modal message
	const today = new Date();
	const dayName = weekdays[today.getDay()];
	const workoutName = loadWorkoutDraft()?.name || `${dayName} Workout`;
	openModal({
		...modalMessages.resumeWorkout(
			clickedContinue,
			clickedDiscard,
			workoutName,
		),
		// Prevents backdrop click from triggering secondary action
		// onBackdropClick: () => {
		// 	if (MODAL) {
		// 		MODAL?.close();
		// 		MODAL?.setAttribute("aria-hidden", "true");
		// 	}
		// },
	});
}
