import { Workout as PrismaWorkout, Exercise, Set } from "@prisma/client";

export type WorkoutWithRelations = PrismaWorkout & {
	exercises: (Exercise & { sets: Set[] })[];
};

export interface SetFormData {
    id: string;
    weight: string;
    reps: string;
}

export interface ExerciseFormData {
    id: string;
    name: string;
    difficulty: number | null;
    notes: string | null;
    sets: SetFormData[];
}

export interface WorkoutFormData {
    name: string;
    durationSeconds: number | null;
    exercises: ExerciseFormData[];
}
