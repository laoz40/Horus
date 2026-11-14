import type { Exercise, Set, Workout } from "@/features/workout-form/lib/validateWorkout";

export const createDefaultSet = (): Set => ({
	id: crypto.randomUUID(),
	// Explicit blanks prevent RHF from restoring indexed defaults when a set is re-added.
	weight: null,
	reps: null,
	completed: false,
});

export const createDefaultExercise = (): Exercise => ({
	id: crypto.randomUUID(),
	global: {
		name: "",
		muscleGroups: [],
	},
	notes: undefined,
	difficulty: undefined,
	sets: [createDefaultSet()],
});

export const createDefaultWorkoutValues = (): Workout => ({
	name: "",
	durationSeconds: 0,
	exercises: [createDefaultExercise()],
});
