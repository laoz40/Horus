import { Workout as PrismaWorkout, Exercise, Set, Prisma } from "@prisma/client";

export type WorkoutDbData = PrismaWorkout & {
	exercises: (Exercise & {
		sets: Set[];
		globalExercise: {
			id: string;
			name: string;
			normalizedName: string;
			muscleGroups: Prisma.JsonValue | null;
		};
	})[];
};

export interface SetFormData {
	id: string;
	weight: number;
	reps: number;
	completed: boolean;
}

export interface ExerciseFormData {
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
