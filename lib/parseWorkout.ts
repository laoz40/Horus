import { ParsedWorkout, WorkoutFormData } from "./types";

export const parseWorkout = (workout: WorkoutFormData): ParsedWorkout => {
	return {
		name: workout.name.trim(),
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			name: exercise.name.trim(),
			difficulty: exercise.difficulty,
			notes: (exercise.notes ?? "").trim(),
			sets: exercise.sets.map((set) => ({
				id: set.id,
				weight: Number(set.weight),
				reps: Number(set.reps),
			})),
		})),
	};
};
