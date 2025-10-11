// import all the functions and variables we need from other files
import { weekdays, formatDisplayDate } from './utils.js';
import { updateLastWorkoutSummary } from './history.js';
import { createExerciseForm } from './workout-builder.js';
import { runMigrations, SCHEMA_VERSION } from './migration.js';
import { EXERCISE_FORM_CONTAINER, EXERCISE_NAME_LIST, WORKOUT_DATE_TEXT, WORKOUT_NAME_INPUT } from './constants.js';
// Set current workout to null, because we don't have one yet
let currentWorkout = null;
// Returns the current workout
export function getCurrentWorkout() {
    return currentWorkout;
}
// Storage keys
export const WORKOUTS_KEY = 'workouts';
export const EXERCISES_KEY = 'exerciseNames';
export const WORKOUT_DRAFT_KEY = 'workoutDraft';
// Load all workouts from localStorage and run migrations
export const loadAllWorkouts = () => {
    try {
        const rawData = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
        // Ensure we have an array before running migrations
        const workoutsArray = Array.isArray(rawData) ? rawData : [];
        return runMigrations(workoutsArray);
    }
    catch (error) {
        console.error('Error loading workouts:', error);
        // Return empty array if there's an error
        return [];
    }
};
// Save all workouts to localStorage
export const saveAllWorkouts = (workouts) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
// Load all exercise names from localStorage
export const loadAllExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
// Save all exercise names to localStorage
export const saveAllExerciseNames = (exerciseNames) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(exerciseNames));
// Map difficulty number to label
export function mapDifficultyNumberToLabel(n) {
    const map = {
        1: '1. Zero effort',
        2: '2. Easy',
        3: '3. Challenging',
        4: '4. Struggled',
        5: '5. Impossible'
    };
    return map[n] || null;
}
// Remove the number prefix from the difficulty label
export function toDifficultyDisplay(label) {
    // If no label, return an empty string
    if (label == null)
        return '';
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
        loadAllExerciseNames().forEach((name) => {
            const exerciseOption = document.createElement("option");
            exerciseOption.value = name;
            EXERCISE_NAME_LIST === null || EXERCISE_NAME_LIST === void 0 ? void 0 : EXERCISE_NAME_LIST.appendChild(exerciseOption);
        });
    }
}
// Start a brand-new workout in memory and reset the form.
export function setupNewWorkout() {
    // Clear any existing workout
    currentWorkout = null;
    const today = new Date();
    const displayDate = formatDisplayDate(today);
    // Set the date
    WORKOUT_DATE_TEXT && (WORKOUT_DATE_TEXT.textContent = displayDate);
    // Set the name to the day of the week (default)
    const dayName = weekdays[today.getDay()];
    if (WORKOUT_NAME_INPUT) {
        WORKOUT_NAME_INPUT.value = dayName;
    }
    // Create the workout object
    currentWorkout = {
        id: `${Date.now()}`,
        schemaVersion: SCHEMA_VERSION,
        name: dayName,
        date: displayDate,
        exercises: []
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
export function validateWorkoutData(workout) {
}
//# sourceMappingURL=data-storage.js.map