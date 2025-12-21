import { currentDay } from "./date";
import { WorkoutFormData } from "./types";
import { Workout } from "./validateWorkout";

export const parseWorkout = (workout: WorkoutFormData): Workout => {
	return {
		name: workout.name.trim() || `${currentDay} Workout`,
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
