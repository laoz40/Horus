import * as z from "zod";
import { getCurrentDay } from "@/lib/date";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";

const MAX_WORKOUT_NAME_LENGTH = 64;
const MAX_EXERCISE_NAME_LENGTH = 64;
const MAX_EXERCISE_NOTES_LENGTH = 500;
const MAX_SET_WEIGHT = 999999;
const MAX_SET_REPS = 999999;

const EXERCISE_NAME_MIN_MESSAGE = "Please enter a real exercise";
const WORKOUT_NAME_MAX_MESSAGE = `Workout name must be ${MAX_WORKOUT_NAME_LENGTH} characters or less.`;
const EXERCISE_NAME_MAX_MESSAGE = `There's no way that's a real exercise. It's over ${MAX_EXERCISE_NAME_LENGTH} characters.`;
const EXERCISE_NOTES_MAX_MESSAGE = `No essay please. Keep it ${MAX_EXERCISE_NOTES_LENGTH} characters or less.`;
const NUMERIC_MAX_MESSAGE = "Are you serious bro?";
const SET_REPS_MISSING_MESSAGE = "Set doesn't have reps. You can't just do nothing.";
const EXERCISE_NO_SETS_MESSAGE = "Exercise has no sets. Did you even do it?";
const NO_EXERCISES_MESSAGE = "No exercises, silly. Go do your workout.";

export const GlobalExerciseInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, EXERCISE_NAME_MIN_MESSAGE)
		.max(MAX_EXERCISE_NAME_LENGTH, EXERCISE_NAME_MAX_MESSAGE),
	muscleGroups: z.array(z.string()).optional(),
});

export const SetSchema = z.object({
	id: z.string(),
	weight: z.number().nonnegative().max(MAX_SET_WEIGHT, NUMERIC_MAX_MESSAGE).optional(),
	reps: z
		.number(SET_REPS_MISSING_MESSAGE)
		.int()
		.positive(SET_REPS_MISSING_MESSAGE)
		.max(MAX_SET_REPS, NUMERIC_MAX_MESSAGE)
		.optional(),
	completed: z.boolean(),
});

// SetSchema keeps reps optional so fully blank draft rows can exist while editing.
// Completing a set is stricter: the current row must be valid immediately, before
// the broader workout submit flow strips empty rows and runs exercise-level checks.
const CompletedSetSchema = SetSchema.extend({
	reps: z
		.number(SET_REPS_MISSING_MESSAGE)
		.int()
		.positive(SET_REPS_MISSING_MESSAGE)
		.max(MAX_SET_REPS, NUMERIC_MAX_MESSAGE),
});

export const ExerciseSchema = z
	.object({
		id: z.string(),
		exerciseId: z.string().optional(),
		global: GlobalExerciseInputSchema,
		difficulty: z.number().optional(),
		notes: z.string().max(MAX_EXERCISE_NOTES_LENGTH, EXERCISE_NOTES_MAX_MESSAGE).optional(),
		sets: z.array(SetSchema).min(1, EXERCISE_NO_SETS_MESSAGE),
	})
	.superRefine((exercise, context) => {
		// Empty rows are stripped before validation; for every remaining set, reps is required.
		exercise.sets.forEach((set, setIndex) => {
			if (set.reps !== undefined) return;

			context.addIssue({
				code: "custom",
				path: ["sets", setIndex, "reps"],
				message: SET_REPS_MISSING_MESSAGE,
			});
		});
	});

export const WorkoutSchema = z.object({
	name: z.string().trim().max(MAX_WORKOUT_NAME_LENGTH, WORKOUT_NAME_MAX_MESSAGE),
	durationSeconds: z.int().nullable(),
	exercises: z.array(ExerciseSchema).min(1, NO_EXERCISES_MESSAGE),
});

const SetForSaveSchema = SetSchema.required({ weight: true, reps: true })
	.extend({ id: z.uuid() })
	.strict();

const ExerciseForSaveSchema = ExerciseSchema.safeExtend({
	id: z.uuid(),
	exerciseId: z.uuid().optional(),
	global: GlobalExerciseInputSchema.strict(),
	difficulty: z.number().int().min(0).max(4).optional(),
	sets: z.array(SetForSaveSchema).min(1),
}).strict();

export const WorkoutForSaveSchema = WorkoutSchema.extend({
	durationSeconds: z.number().int().nonnegative().nullable(),
	exercises: z.array(ExerciseForSaveSchema).min(1),
}).strict();

export const SanitizedWorkoutSchema = z.preprocess(stripEmptyWorkoutEntries, WorkoutSchema);

const WorkoutForSaveInputSchema = SanitizedWorkoutSchema.transform((workout) => ({
	...workout,
	name: workout.name || `${getCurrentDay()} Workout`,
	exercises: workout.exercises.map((exercise) => ({
		...exercise,
		sets: exercise.sets.map((set) => ({
			...set,
			weight: set.weight ?? 0,
		})),
	})),
})).pipe(WorkoutForSaveSchema);

export function parseWorkoutForSave(workout: Workout, durationSeconds: number) {
	return WorkoutForSaveInputSchema.safeParse({ ...workout, durationSeconds });
}

export const validateWorkout = (workout: Workout) => {
	return SanitizedWorkoutSchema.safeParse(workout);
};

export const validateCompletedSet = (set: Set | undefined) => {
	return CompletedSetSchema.safeParse(set);
};

export type Set = z.infer<typeof SetSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
