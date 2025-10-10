export interface ExerciseSet {
  weight: number;
  reps: number;
}

export interface Exercise {
  name: string;
  sets: ExerciseSet[];
  difficulty?: string | null | undefined;
  notes?: string;
}

export interface Workout {
  id: string;
  schemaVersion: number;
  name: string;
  date: string;
  exercises: Exercise[];
}

export interface WorkoutDraft {
  name?: string;
  date?: string;
  exercises?: Exercise[];
}

// Update the type of MIGRATIONS to allow any number as a key
export interface MigrationFunction {
  (workout: Workout): Workout;
}
export interface Migrations {
  [key: number]: MigrationFunction | undefined;
}