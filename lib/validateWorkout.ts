import * as z from "zod";

export const GlobalExerciseInputSchema = z
	.object({
		exerciseId: z.string({ message: "Exercise ID not found" }).optional(),
		newExerciseName: z
			.string()
			.trim()
			.min(2, "Can you enter a real exercise?")
			.optional(),
	})
	.refine(
		(value) =>
			(value.exerciseId && !value.newExerciseName) ||
			(!value.exerciseId && value.newExerciseName),
		{
			message: "Select or type an exercise.",
		},
	);

const SetSchema = z
	.object({
		id: z.string(),
		weight: z.number().nonnegative().nullable(),
		reps: z
			.number()
			.int()
			.gt(0, "Set doesn't have reps. You can't just do nothing.")
			.nullable(),
	})
	.refine((set) => set.weight !== null && set.reps !== null, {
		message: "Set is empty",
	});

const ExerciseSchema = z.object({
	id: z.string(),
	exercise: GlobalExerciseInputSchema,
	difficulty: z.number().nullable(),
	notes: z.string().nullable(),
	sets: z.array(SetSchema).min(1, "Exercise has no sets. Did you even do it?"),
});

export const WorkoutSchema = z.object({
	name: z.string().min(1, "No Workout Name"),
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
