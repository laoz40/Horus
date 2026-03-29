interface SetFormData {
	id: string;
	weight?: number;
	reps?: number;
	completed: boolean;
}

interface ExerciseFormData {
	id: string;
	global: {
		name: string;
		muscleGroups?: string[];
	};
	difficulty?: number;
	notes?: string;
	sets: SetFormData[];
}

export interface WorkoutFormData {
	name: string;
	durationSeconds: number | null;
	exercises: ExerciseFormData[];
}

export interface SetForSave {
	id: string;
	weight: number;
	reps: number;
	completed: boolean;
}

export interface ExerciseForSave {
	id: string;
	global: {
		name: string;
		muscleGroups?: string[];
	};
	difficulty?: number;
	notes?: string;
	sets: SetForSave[];
}

export interface WorkoutForSave {
	name: string;
	durationSeconds: number | null;
	exercises: ExerciseForSave[];
}
