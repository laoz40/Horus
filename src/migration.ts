import { Exercise, Migrations, Workout } from "./types.js";
import { saveAllWorkouts } from "./data-storage.js";

export const SCHEMA_VERSION = 2;

// Migration function to update workout data when the app's data structure changes
// Each migration is keyed by the version it migrates FROM
export const MIGRATIONS: Migrations = {
  // This migration (v2 to v3) updates the difficulty 1 label format for exercises
  2: (workout: Workout) => {
    if (!workout || !workout.exercises) return workout;
    
    const updatedWorkout = { ...workout };
    updatedWorkout.exercises = workout.exercises.map((exercise: Exercise) => {
      if (exercise.difficulty === '1. Zero effort required') {
        return { ...exercise, difficulty: '1. Zero effort' };
      }
      return exercise;
    });
    
    return updatedWorkout;
  },
};

// Run migrations
export function runMigrations(workouts: Workout[]) {
  // If workouts is not an array, return an empty array
  if (!Array.isArray(workouts)) {
    console.warn('Expected workouts to be an array, got:', workouts);
    return [];
  }

  let changed = false;
  const migratedWorkouts = [];

  // Process each workout
  for (const workout of workouts) {
    try {
      // Skip invalid workouts
      if (!workout || typeof workout !== 'object') {
        console.warn('Skipping invalid workout:', workout);
        continue;
      }

      // Determine the starting version for this workout
      const fromVersion = ('schemaVersion' in workout) ? (workout.schemaVersion || 1) : 1;
      let currentWorkout = { ...workout };
      let workoutChanged = false;

      // Apply each migration in sequence
      for (let version = fromVersion; version < SCHEMA_VERSION; version++) {
        const migrationFunction = MIGRATIONS[version];
        if (typeof migrationFunction === 'function') {
          const migratedWorkout = migrationFunction(currentWorkout) || currentWorkout;
          if (migratedWorkout !== currentWorkout) {
            workoutChanged = true;
            currentWorkout = migratedWorkout;
          }
        }
      }

      // Update the schema version
      if (workoutChanged) {
        currentWorkout.schemaVersion = SCHEMA_VERSION;
        changed = true;
      }

      migratedWorkouts.push(currentWorkout);
    } catch (error) {
      console.error('Error migrating workout:', error, 'Workout:', workout);
      // If there's an error, try to keep the original workout
      if (workout) migratedWorkouts.push(workout);
    }
  }

  // If any workouts were changed, save them back to localStorage
  if (changed) {
    try {
      saveAllWorkouts(migratedWorkouts);
    } catch (error) {
      console.error('Error saving migrated workouts:', error);
    }
  }

  return migratedWorkouts;
}