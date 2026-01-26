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
	weight: number;
	reps: number;
}

export interface ExerciseFormData {
	id: string;
	name: string;
	global: {
		name: string;
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
