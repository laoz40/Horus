import { Workout as PrismaWorkout, Exercise, Set } from "@prisma/client";

export type WorkoutWithRelations = PrismaWorkout & {
	exercises: (Exercise & { sets: Set[] })[];
};

export type WorkoutFormData = {
	name: string;
	exercises: {
		id: string;
		name: string;
		difficulty: number | null;
		notes: string | null;
		sets: {
			id: string;
			weight: string;
			reps: string;
		}[];
	}[];
};

export interface ExerciseFormData {
	name: string;
	sets: {
		weight: string;
		reps: string;
		id: string;
	}[];
	difficulty: number | null;
	notes: string | null;
	id: string;
}
