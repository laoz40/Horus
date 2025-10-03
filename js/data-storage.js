// import all the functions and variables we need from other files
import { weekdays, formatDisplayDate } from './utils.js';
import { updateLastWorkoutSummary } from './history.js';
import { createExerciseForm } from './workout-builder.js';

// Internal state
let currentWorkout = null;

export function getCurrentWorkout() {
  return currentWorkout;
}

// Storage, schema versioning, and migrations
export const WORKOUTS_KEY = 'workouts';
export const EXERCISES_KEY = 'exerciseNames';
export const SCHEMA_VERSION = 2;
// Draft storage key for preserving in-progress form data across refresh
export const WORKOUT_DRAFT_KEY = 'workoutDraft';

// Draft load/save helpers
export const loadWorkoutDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(WORKOUT_DRAFT_KEY) || 'null');
  } catch (_) {
    return null;
  }
};
export const saveWorkoutDraft = (draft) => {
  try {
    if (draft && typeof draft === 'object') {
      localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
    }
  } catch (_) {
    // ignore
  }
};
export const clearWorkoutDraft = () => {
  try { localStorage.removeItem(WORKOUT_DRAFT_KEY); } catch (_) { /* ignore */ }
};

// Load/save helpers
export const loadAllWorkouts = () => {
  const raw = JSON.parse(localStorage.getItem(WORKOUTS_KEY) || '[]');
  return runMigrations(raw);
};
export const saveAllWorkouts = (arr) => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(arr));
export const loadAllExerciseNames = () => JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
export const saveAllExerciseNames = (arr) => localStorage.setItem(EXERCISES_KEY, JSON.stringify(arr));

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

export function toDifficultyDisplay(label) {
  if (label == null) return '';
  const m = String(label).match(/^\s*\d+\.\s*(.+)$/);
  return m ? m[1] : String(label);
}

export const MIGRATIONS = {
  1: (w) => {
    if (!w || typeof w !== 'object') return w;
    const newW = { ...w };
    newW.schemaVersion = 2;
    if (!Array.isArray(newW.exercises)) return newW;
    newW.exercises = newW.exercises.map((ex) => {
      const newEx = { ...ex };
      let promoted = null;
      if (Array.isArray(newEx.sets)) {
        let maxDiff = null;
        newEx.sets = newEx.sets.map((s) => {
          const ns = { ...s };
          if (ns && typeof ns.difficulty !== 'undefined' && ns.difficulty !== null) {
            const num = Number(ns.difficulty);
            if (!Number.isNaN(num)) maxDiff = (maxDiff == null) ? num : Math.max(maxDiff, num);
          }
          if ('difficulty' in ns) delete ns.difficulty;
          return ns;
        });
        if (maxDiff != null) promoted = mapDifficultyNumberToLabel(maxDiff);
      }
      if (newEx.difficulty == null && promoted) {
        newEx.difficulty = promoted;
      } else if (typeof newEx.difficulty === 'number') {
        newEx.difficulty = mapDifficultyNumberToLabel(newEx.difficulty);
      }
      return newEx;
    });
    return newW;
  }
};

export function runMigrations(workouts) {
  let changed = false;
  const upgraded = workouts.map((w) => {
    const from = (w && typeof w === 'object' && 'schemaVersion' in w) ? (w.schemaVersion || 1) : 1;
    let curr = { ...w };
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

// Fill the exercise name suggestions list.
// Reads saved exercise names and adds them to the datalist so you can pick
// from names you used before instead of typing them again.
export function populateExerciseDatalist() {
  const list = document.getElementById('exercise-name-list');
  if (!list) return;
  list.innerHTML = '';
  loadAllExerciseNames().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    list.appendChild(opt);
  });
}

// Start a brand-new workout in memory and reset the form.
// Sets today's date, uses the weekday as a default name, clears old forms,
// adds one blank exercise form, refreshes suggestions, and updates the
// dashboard summary.
export function setupNewWorkout() {
  // Clear any existing workout
  currentWorkout = null;
  const today = new Date();
  const displayDate = formatDisplayDate(today);
  const workoutDateEl = document.getElementById('workout-date');
  const workoutNameInput = document.getElementById('workout-name');
  // Set the date
  workoutDateEl && (workoutDateEl.textContent = displayDate);
  // Set the name
  const dayName = weekdays[today.getDay()];
  workoutNameInput && (workoutNameInput.value = dayName);
  // Create the workout
  currentWorkout = {
    id: `${Date.now()}`,
    schemaVersion: SCHEMA_VERSION,
    name: workoutNameInput ? workoutNameInput.value.trim() : dayName,
    date: workoutDateEl ? workoutDateEl.textContent : displayDate,
    exercises: []
  };
  const exerciseFormsContainer = document.getElementById('add-exercise-form');
  if (exerciseFormsContainer) {
    exerciseFormsContainer.innerHTML = '';
    exerciseFormsContainer.appendChild(createExerciseForm());
  }
  populateExerciseDatalist();
  updateLastWorkoutSummary();
}