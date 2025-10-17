// Data structures for the app
export interface ExerciseSet {
	weight: number | null;
	reps: number | null;
}

export interface Exercise {
	name: string;
	sets: ExerciseSet[];
	difficulty?: string | null;
	notes?: string;
}

export interface Workout {
	id: string;
	schemaVersion: number;
	name: string;
	date: string;
	exercises: Exercise[];
}

export interface EditWorkoutData {
	index: number;
	originalWorkout: Workout;
}

export interface WorkoutDraft {
	name?: string;
	date?: string;
	exercises?: Exercise[];
}

// Form versions of the same data structures
export interface ExerciseSetForm {
	weight: string; // empty string represents 0
	reps: string; // empty string represents 0
}

export interface ExerciseForm {
	name: string;
	sets: ExerciseSetForm[];
	difficulty?: string | null;
	notes?: string;
}

// Update the type of MIGRATIONS to allow any number as a key
export type MigrationFunction = (workout: Workout) => Workout;
export interface Migrations {
	[key: number]: MigrationFunction | undefined;
}

// Modal messages
export interface ModalMessage {
	title: string;
	message: string;
	primaryText?: string;
	secondaryText?: string;
	onPrimary?: () => void;
	onSecondary?: () => void;
	onBackdropClick?: () => void;
	dismissOnBackdrop?: boolean;
	dismissOnEsc?: boolean;
}

// Page change event
export interface PageChangeEvent extends CustomEvent {
	detail: {
		pageId: string;
	};
}
