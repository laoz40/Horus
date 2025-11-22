import { Workout as PrismaWorkout, Exercise, Set } from "@prisma/client";

export type WorkoutWithRelations = PrismaWorkout & {
  exercises: (Exercise & { sets: Set[] })[];
};

export type SetInput = {
  weight: number;
  reps: number;
};

// Each exercise submitted by the form
export type ExerciseInput = {
  name: string;
  sets: SetInput[];
};

// Workout submitted by the form
export type WorkoutInput = {
  name: string;
  exercises: ExerciseInput[];
};
