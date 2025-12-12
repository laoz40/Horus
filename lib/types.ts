import { Workout as PrismaWorkout, Exercise, Set } from "@prisma/client";

export type WorkoutWithRelations = PrismaWorkout & {
	exercises: (Exercise & { sets: Set[] })[];
};

export type SetInput = {
	weight: number;
	reps: number;
};

export type ExerciseInput = {
	name: string;
	sets: SetInput[];
};

export type WorkoutInput = {
	name: string;
	exercises: ExerciseInput[];
};

export type WorkoutFormData = {
	name: string;
	exercises: {
		id: string;
		name: string;
		sets: {
			id: string;
			weight: string;
			reps: string;
		}[];
	}[];
};
