import * as z from "zod";

const SetSchema = z.object({
	weight: z.number().nonnegative(),
	reps: z.int().gt(0),
});

const ExerciseSchema = z.object({
	name: z.string().min(1, "Empty Exercise"),
	difficulty: z.number().nullable(),
	notes: z.string().nullable(),
	sets: z.array(SetSchema).min(1, "No Sets"),
});

const WorkoutSchema = z.object({
	name: z.string().min(1, "No Workout Name"),
	durationSeconds: z.int().nullable(),
	exercises: z.array(ExerciseSchema).min(1, "No Exercises"),
});

export const validateSet = (set: Set) => {
	return SetSchema.safeParse(set);
};
export const validateExercise = (exercise: Exercise) => {
	return ExerciseSchema.safeParse(exercise);
};
export const validateWorkout = (workout: Workout) => {
	return WorkoutSchema.safeParse(workout);
};

export type Set = z.infer<typeof SetSchema>
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
