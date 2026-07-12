import { Exercise, Set, Workout } from "@/features/workout-form/lib/validateWorkout";

export const createDefaultSet = (): Set => ({
	id: crypto.randomUUID(),
	weight: undefined,
	reps: undefined,
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
