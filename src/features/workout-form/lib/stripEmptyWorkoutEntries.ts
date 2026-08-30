import type { Workout } from "@/features/workout-form/lib/validateWorkout";

// Strip fully empty sets/exercises before validation.
export const stripEmptyWorkoutEntries = (workout: Workout): Workout => {
	const sanitizedExercises = workout.exercises
		.map((exercise) => ({
			...exercise,
			// Drop sets where neither weight nor reps was entered.
			sets: exercise.sets.filter((set) => set.weight !== undefined || set.reps !== undefined),
		}))
		// Drop exercises with no name and no remaining sets.
		.filter((exercise) => exercise.global.name.trim() !== "" || exercise.sets.length > 0);

	return {
		...workout,
		exercises: sanitizedExercises,
	};
};
