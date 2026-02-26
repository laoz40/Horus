interface SetFormData {
	id: string;
	weight: number;
	reps: number;
	completed: boolean;
}

interface ExerciseFormData {
	id: string;
	global: {
		name: string;
		muscleGroups?: string[];
	};
	difficulty: number | undefined;
	notes: string | undefined;
	sets: SetFormData[];
}

export interface WorkoutFormData {
	name: string;
	durationSeconds: number | null;
	exercises: ExerciseFormData[];
}
