import * as z from "zod";
import { stripEmptyWorkoutEntries } from "./stripEmptyWorkoutEntries";

const GlobalExerciseInputSchema = z.object({
	name: z.string().trim().min(2, "Enter a real exercise"),
	muscleGroups: z.array(z.string()).optional(),
});

const SetSchema = z.object({
	id: z.string(),
	weight: z.number().nonnegative().optional(),
	reps: z.union([
		z
			.number("Set doesn't have reps.")
			.int()
			.positive("Set doesn't have reps. You can't just do nothing."),
		z.undefined(),
	]),
	completed: z.boolean(),
});

const ExerciseSchema = z
	.object({
		id: z.string(),
		global: GlobalExerciseInputSchema,
		difficulty: z.number().optional(),
		notes: z.string().optional(),
		sets: z.array(SetSchema).min(1, "Exercise has no sets. Did you even do it?"),
	})
	.superRefine((exercise, context) => {
		// Empty rows are stripped before validation; for every remaining set, reps is required.
		exercise.sets.forEach((set, setIndex) => {
			if (set.reps !== undefined) return;

			context.addIssue({
				code: "custom",
				path: ["sets", setIndex, "reps"],
				message: "Set doesn't have reps. You can't just do nothing.",
			});
		});
	});

export const WorkoutSchema = z.object({
	name: z.string(),
	durationSeconds: z.int().nullable(),
	exercises: z.array(ExerciseSchema).min(1, "No exercises, silly. Go do your workout."),
});

const SanitizedWorkoutSchema = z.preprocess(
	stripEmptyWorkoutEntries,
	WorkoutSchema,
);

export const validateWorkout = (workout: Workout) => {
	return SanitizedWorkoutSchema.safeParse(workout);
};

export type Set = z.infer<typeof SetSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
