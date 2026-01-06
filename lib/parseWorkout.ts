import { currentDay } from "./date";
import { WorkoutFormData } from "./types";
import { Workout } from "./validateWorkout";

// TODO: refactor to reduce repeated code
export const parseCreatedWorkout = (workout: WorkoutFormData): Workout=> {
	return {
		name: workout.name.trim() || `${currentDay} Workout`,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			exercise: {
				exerciseId: exercise.exercise.exerciseId,
				newExerciseName: exercise.exercise.newExerciseName?.trim(),
			},
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

export const parseUpdatedWorkout = (workout: WorkoutFormData): Workout=> {
	return {
		name: workout.name.trim() || `${currentDay} Workout`,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			exercise: {
				exerciseId: exercise.exercise.exerciseId,
			},
			difficulty: exercise.difficulty,
			notes: (exercise.notes ?? "").trim(),
			sets: exercise.sets.map((set) => ({
				id: set.id ?? crypto.randomUUID(),
				weight: Number(set.weight),
				reps: Number(set.reps),
			})),
		})),
	};
};

export const normalizeExerciseName = (name: string) => {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
};
