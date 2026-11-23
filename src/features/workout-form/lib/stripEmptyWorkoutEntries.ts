import type { Exercise, Set, Workout } from "@/features/workout-form/lib/validateWorkout";

const hasSetInput = (set: Set) =>
	(set.weight !== undefined && set.weight !== null) ||
	(set.reps !== undefined && set.reps !== null);

export const isEmptyWorkoutExercise = (exercise: Exercise): boolean =>
	exercise.global.name.trim() === "" && !exercise.sets.some(hasSetInput);

// Strip fully empty sets/exercises before validation.
export const stripEmptyWorkoutEntries = (workout: Workout): Workout => {
	const sanitizedExercises = workout.exercises
		.filter((exercise) => !isEmptyWorkoutExercise(exercise))
		.map((exercise) => ({
			...exercise,
			sets: exercise.sets.filter(hasSetInput),
		}));

	return {
		...workout,
		exercises: sanitizedExercises,
	};
};
