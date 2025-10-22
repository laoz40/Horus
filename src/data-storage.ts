// import all the functions and variables we need from other files

import {
	EXERCISE_FORM_CONTAINER,
	EXERCISE_NAME_LIST,
	WORKOUT_DATE_TEXT,
	WORKOUT_NAME_INPUT,
} from "./constants.js";
import { updateLastWorkoutSummary } from "./history.js";
import { runMigrations, SCHEMA_VERSION } from "./migration.js";
import { modalMessages, openModal } from "./modal.js";
import type { Exercise, Workout } from "./types.js";
import { displayFullDate } from "./utils.js";
import { createExerciseForm } from "./workout-builder.js";

// Set current workout to null, because we don't have one yet
let currentWorkout: Workout | null = null;

// Set the current workout
export function setCurrentWorkout(workout: Workout | null) {
	currentWorkout = workout;
}

// Get the current workout
export function getCurrentWorkout() {
	return currentWorkout;
}

// Storage keys
export const WORKOUTS_KEY = "workouts";
export const EXERCISES_KEY = "exerciseNames";
export const WORKOUT_DRAFT_KEY = "workoutDraft";

// Load all workouts from localStorage and run migrations
export const loadAllWorkouts = () => {
	try {
		const rawData = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || "[]");
		// Ensure we have an array before running migrations
		const workoutsArray = Array.isArray(rawData) ? rawData : [];
		return runMigrations(workoutsArray);
	} catch (error) {
		console.error("Error loading workouts:", error);
		// Return empty array if there's an error
		return [];
	}
};

// Save all workouts to localStorage
export const saveAllWorkouts = (workouts: Workout[]) =>
	localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
// Load all exercise names from localStorage
export const loadAllExerciseNames = (): string[] =>
	JSON.parse(localStorage.getItem(EXERCISES_KEY) || "[]");
// Save all exercise names to localStorage
export const saveAllExerciseNames = (exerciseNames: string[]): void =>
	localStorage.setItem(EXERCISES_KEY, JSON.stringify(exerciseNames));

// Map difficulty number to label
export function mapDifficultyNumberToLabel(n: number) {
	const map = {
		1: "1. Zero effort",
		2: "2. Easy",
		3: "3. Challenging",
		4: "4. Struggled",
		5: "5. Impossible",
	};
	return map[n as keyof typeof map] || null;
}
// Remove the number prefix from the difficulty label
export function toDifficultyDisplay(label: string) {
	// If no label, return an empty string
	if (label == null) return "";
	// Match the label the regex pattern
	const match = String(label).match(/^\s*\d+\.\s*(.+)$/);
	// Return the match or the label as a string
	return match ? match[1] : String(label);
}

// Reads saved exercise names and adds them to the datalist
export function populateExerciseDatalist() {
	if (EXERCISE_NAME_LIST) {
		// Clear the list
		EXERCISE_NAME_LIST.innerHTML = "";
		// Add each exercise name to the list
		loadAllExerciseNames().forEach((name: string) => {
			const exerciseOption = document.createElement("option");
			exerciseOption.value = name;
			EXERCISE_NAME_LIST?.appendChild(exerciseOption);
		});
	}
}

// Start a brand-new workout in memory and reset the form.
export function setupNewWorkout() {
	// Clear any existing workout
	currentWorkout = null;
	const today = new Date();
	const displayDate = displayFullDate(today);
	// Set the date
	if (WORKOUT_NAME_INPUT) WORKOUT_NAME_INPUT.value = "";
	if (WORKOUT_DATE_TEXT) WORKOUT_DATE_TEXT.textContent = displayDate;

	// Create the workout object
	currentWorkout = {
		id: `${Date.now()}`,
		schemaVersion: SCHEMA_VERSION,
		name: "",
		date: today.toISOString(),
		exercises: [] as Exercise[],
	};
	// Create the exercise form
	if (EXERCISE_FORM_CONTAINER) {
		// Clear the container
		EXERCISE_FORM_CONTAINER.innerHTML = "";
		// Add the exercise form
		EXERCISE_FORM_CONTAINER.appendChild(createExerciseForm());
	}
	// Populate the exercise name suggestions list
	populateExerciseDatalist();
	// Update the last workout summary
	updateLastWorkoutSummary();
}

// Validate the workout data
export function validateWorkoutData() {
	// If no exercise forms, show error and stop
	const EXERCISE_FORMS = document.querySelectorAll(".add-exercise-form");
	if (!EXERCISE_FORMS || EXERCISE_FORMS.length === 0) {
		openModal(modalMessages.noExercises);
		return false;
	}

	// Check if there's at least one complete set across all exercises
	let validSet = false;
	for (const exerciseForm of EXERCISE_FORMS) {
		const SET_ROWS = exerciseForm.querySelectorAll(".set-row");
		for (const setRow of SET_ROWS) {
			const SET_WEIGHT =
				setRow.querySelector<HTMLInputElement>(".set-weight")?.value.trim() ||
				"";
			const SET_REPS =
				setRow.querySelector<HTMLInputElement>(".set-reps")?.value.trim() || "";
			const setRepsNumber = SET_REPS === "" ? null : Number(SET_REPS);

			if (
				SET_WEIGHT !== "" &&
				SET_REPS !== "" &&
				setRepsNumber !== null &&
				setRepsNumber > 0
			) {
				validSet = true;
				break;
			}
		}
		if (validSet) break;
	}

	if (!validSet) {
		openModal(modalMessages.noExercises);
		return false;
	}

	// Validate each exercise form
	for (const exerciseForm of EXERCISE_FORMS) {
		// If no exercise name, show error and stop
		const EXERCISE_NAME_INPUT =
			exerciseForm
				.querySelector<HTMLInputElement>(".exercise-name")
				?.value.trim() || "";
		if (EXERCISE_NAME_INPUT === "") {
			openModal(modalMessages.missingExerciseName);
			return false;
		}

		// Validate each set row inside this form
		const SET_ROWS = exerciseForm.querySelectorAll(".set-row");
		for (const [setIndex, setRow] of Array.from(SET_ROWS).entries()) {
			const SET_WEIGHT =
				setRow.querySelector<HTMLInputElement>(".set-weight")?.value.trim() ||
				"";
			const SET_REPS =
				setRow.querySelector<HTMLInputElement>(".set-reps")?.value.trim() || "";

			// Convert reps to number only for numeric check (but only if non-empty)
			const setRepsNumber = SET_REPS === "" ? null : Number(SET_REPS);

			// reps cannot be empty or zero
			if (
				SET_WEIGHT !== "" &&
				(SET_REPS === "" || setRepsNumber === null || setRepsNumber < 1)
			) {
				openModal(modalMessages.missingReps(setIndex + 1, EXERCISE_NAME_INPUT));
				return false;
			}
			// weight cannot be empty when reps has a value
			if (SET_REPS !== "" && SET_WEIGHT === "") {
				openModal(
					modalMessages.missingWeight(setIndex + 1, EXERCISE_NAME_INPUT),
				);
				return false;
			}
		}
	}
	// Everything is valid
	return true;
}
