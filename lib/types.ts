import { Workout as PrismaWorkout, Exercise, Set } from "@prisma/client";

export type WorkoutDbData = PrismaWorkout & {
	exercises: (Exercise & {
		sets: Set[];
		globalExercise: {
			id: string;
			name: string;
			normalizedName: string;
		};
	})[];
};

export interface SetFormData {
	id: string;
	weight: string;
	reps: string;
}

export interface ExerciseFormData {
	id: string;
	name: string;
	exercise: {
		exerciseId?: string;
		newExerciseName?: string;
	};
	difficulty: number | null;
	notes: string | null;
	sets: SetFormData[];
}

export interface WorkoutFormData {
	name: string;
	durationSeconds: number | null;
	exercises: ExerciseFormData[];
}
