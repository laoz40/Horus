import * as z from "zod";

export const GlobalExerciseInputSchema = z.object({
	name: z.string().trim().min(2, "Enter an exercise"),
});

const SetSchema = z.object({
	id: z.string(),
	weight: z.number().nonnegative().optional(),
	reps: z
	.union([
		z.number("Set doesn't have reps.").int().positive("Set doesn't have reps. You can't just do nothing."),
		// valueAsNumber: true stops the input from being undefined
		z.undefined(),
	])
});

const ExerciseSchema = z.object({
	id: z.string(),
	global: GlobalExerciseInputSchema,
	difficulty: z.number().optional(),
	notes: z.string().optional(),
	sets: z.array(SetSchema).min(1, "Exercise has no sets. Did you even do it?"),
});

export const WorkoutSchema = z.object({
	name: z.string(),
	durationSeconds: z.int().nullable(),
	exercises: z
		.array(ExerciseSchema)
		.min(1, "No exercises, silly. Go do your workout."),
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

export type Set = z.infer<typeof SetSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
