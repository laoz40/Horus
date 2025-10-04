// import all the functions and variables we need from other files
import { weekdays, formatDisplayDate } from './utils.js';
import { updateLastWorkoutSummary } from './history.js';
import { createExerciseForm } from './workout-builder.js';

// Set current workout to null, because we don't have one yet
let currentWorkout = null;

// Returns the current workout
export function getCurrentWorkout() {
  return currentWorkout;
}

// Storage keys
export const WORKOUTS_KEY = 'workouts';
export const EXERCISES_KEY = 'exerciseNames';
export const SCHEMA_VERSION = 2;
export const WORKOUT_DRAFT_KEY = 'workoutDraft';

// load the draft from localStorage
export const loadWorkoutDraft = () => {
  try {
    // Get the draft from localStorage
    return JSON.parse(localStorage.getItem(WORKOUT_DRAFT_KEY) || 'null');
  } catch (_) {
    // If there's an error, return null
    return null;
  }
};

// Save the draft to localStorage
export const saveWorkoutDraft = (draft) => {
  try {
    // If the draft is an object, save it to localStorage
    if (draft && typeof draft === 'object') {
      localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
    }
  } catch (_) {
    // Ignore any errors
  }
};

// Clear the draft from localStorage
export const clearWorkoutDraft = () => {
  try { 
    localStorage.removeItem(WORKOUT_DRAFT_KEY); 
  } catch (_) { 
    // Ignore any errors
  }
};

// Load all workouts from localStorage and run migrations
export const loadAllWorkouts = () => {
  const rawData = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
  return runMigrations(rawData);
};

// Save all workouts to localStorage
export const saveAllWorkouts = (array) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(array));

// Load all exercise names from localStorage
export const loadAllExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');

// Save all exercise names to localStorage
export const saveAllExerciseNames = (array) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(array));

// Map difficulty number to label
export function mapDifficultyNumberToLabel(n) {
  const map = {
    1: '1. Zero effort required',
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
  if (label == null) return '';
  // Match the label the regex pattern
  const match = String(label).match(/^\s*\d+\.\s*(.+)$/);
  // Return the match or the label as a string
  return match ? match[1] : String(label);
}

// Migration function so that old workouts can be loaded in the new format
export const MIGRATIONS = {
  // Migration from version 1 to version 2
  1: (workout) => {
    // If no workout, return it as is
    if (!workout || typeof workout !== 'object') return workout;
    const newWorkout = { ...workout };
    // Set the schema version to 2
    newWorkout.schemaVersion = 2;
    // If no exercises, return the workout as is
    if (!Array.isArray(newWorkout.exercises)) return newWorkout;
    // Map each exercise to a new object
    newWorkout.exercises = newWorkout.exercises.map((exercise) => {
      const newExercise = { ...exercise };
      let promotedDifficulty = null;
      // If the exercise has sets
      if (Array.isArray(newExercise.sets)) {
        let maxDifficulty = null;
        // Map each set to a new object
        newExercise.sets = newExercise.sets.map((set) => {
          const newSet = { ...set };
          // If the set has a difficulty, update maxDifficulty
          if (newSet && typeof newSet.difficulty !== 'undefined' && newSet.difficulty !== null) {
            const difficultyValue = Number(newSet.difficulty);
            if (!Number.isNaN(difficultyValue)) maxDifficulty = (maxDifficulty == null) ? difficultyValue : Math.max(maxDifficulty, difficultyValue);
          }
          // Remove the difficulty from the set, as it's stored on the exercise now
          if ('difficulty' in newSet) delete newSet.difficulty;
          return newSet;
        });
        // If there was a max difficulty, set it on the exercise
        if (maxDifficulty != null) promotedDifficulty = mapDifficultyNumberToLabel(maxDifficulty);
      }
      // If the exercise has a difficulty, set it on the exercise
      if (newExercise.difficulty == null && promotedDifficulty) {
        newExercise.difficulty = promotedDifficulty;
        // If the difficulty is a number, convert it to a label
      } else if (typeof newExercise.difficulty === 'number') {
        newExercise.difficulty = mapDifficultyNumberToLabel(newExercise.difficulty);
      }
      return newExercise;
    });
    return newWorkout;
  }
};

// Run migrations
export function runMigrations(workouts) {
  let changed = false;
  const upgraded = workouts.map((workout) => {
    const from = (workout && typeof workout === 'object' && 'schemaVersion' in workout) ? (workout.schemaVersion || 1) : 1;
    let curr = { ...workout };
    for (let v = from; v < SCHEMA_VERSION; v++) {
      const migrate = MIGRATIONS[v];
      if (typeof migrate === 'function') {
        const next = migrate(curr) || curr;
        if (next !== curr) changed = true;
        curr = next;
      }
    }
    return curr;
  });
  if (changed) {
    saveAllWorkouts(upgraded);
    // Store and return the new workout
    currentWorkout = upgraded[upgraded.length - 1];
    return currentWorkout;
  }
  return workouts;
}

// Reads saved exercise names and adds them to the datalist
export function populateExerciseDatalist() {
  const exerciseList = document.getElementById("exercise-name-list");
  if (exerciseList) {
    // Clear the list
    exerciseList.innerHTML = "";
    // Add each exercise name to the list
    loadAllExerciseNames().forEach((name) => {
      const exerciseOption = document.createElement("option");
      exerciseOption.value = name;
      exerciseList.appendChild(exerciseOption);
    });
  }
}

// Start a brand-new workout in memory and reset the form.
export function setupNewWorkout() {
  // Clear any existing workout
  currentWorkout = null;
  const today = new Date();
  const displayDate = formatDisplayDate(today);
  const workoutDateText = document.getElementById('workout-date');
  const workoutNameInput = document.getElementById('workout-name');
  // Set the date
  workoutDateText && (workoutDateText.textContent = displayDate);
  // Set the name to the day of the week (default)
  const dayName = weekdays[today.getDay()];
  workoutNameInput && (workoutNameInput.value = dayName);
  // Create the workout object
  currentWorkout = {
    id: `${Date.now()}`,
    schemaVersion: SCHEMA_VERSION,
    name: workoutNameInput ? workoutNameInput.value.trim() : dayName,
    date: workoutDateText ? workoutDateText.textContent : displayDate,
    exercises: []
  };
  // Create the exercise form
  const exerciseFormsContainer = document.getElementById('add-exercise-form');
  if (exerciseFormsContainer) {
    // Clear the container
    exerciseFormsContainer.innerHTML = "";
    // Add the exercise form
    exerciseFormsContainer.appendChild(createExerciseForm());
  }
  // Populate the exercise name suggestions list
  populateExerciseDatalist();
  // Update the last workout summary
  updateLastWorkoutSummary();
}