import { Exercise, Set, Workout } from "@/features/workout-form/lib/validateWorkout";
import { sanitizeWorkoutForSubmit } from "@/features/workout-form/lib/workoutSanitizers";

export interface MutationSet extends Omit<Set, "weight" | "reps"> {
	weight: number;
	reps: number;
}

export interface MutationExercise extends Omit<Exercise, "sets"> {
	sets: MutationSet[];
}

export interface MutationWorkout extends Omit<Workout, "exercises"> {
	exercises: MutationExercise[];
}

export const normalizeWorkoutForMutation = (workout: Workout): MutationWorkout => {
	const sanitizedWorkout = sanitizeWorkoutForSubmit(workout) as Workout;

	return {
		...sanitizedWorkout,
		exercises: sanitizedWorkout.exercises.map((exercise) => ({
			...exercise,
			sets: exercise.sets
				.filter((set): set is Set & { reps: number } => set.reps !== undefined)
				.map((set) => ({
					...set,
					weight: set.weight ?? 0,
					reps: set.reps,
					completed: Boolean(set.completed),
				})),
		})),
	};
};
