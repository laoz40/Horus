import { getCurrentDay } from "../date";
import type { WorkoutFormData } from "../../features/workout-form/lib/types";

export const parseWorkout = (workout: WorkoutFormData) => {
	return {
		name: workout.name.trim() || `${getCurrentDay()} Workout`,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => {
			const global = {
				name: exercise.global.name.trim(),
				...(exercise.global.muscleGroups !== undefined
					? { muscleGroups: exercise.global.muscleGroups }
					: {}),
			};

			return {
				id: exercise.id,
				global,
				...(exercise.difficulty !== undefined
					? { difficulty: exercise.difficulty }
					: {}),
				notes: (exercise.notes ?? "").trim(),
				sets: exercise.sets.map((set) => ({
					id: set.id,
					weight: Number(set.weight) || 0,
					reps: Number(set.reps),
					completed: set.completed ?? false,
				})),
			};
		}),
	};
};
