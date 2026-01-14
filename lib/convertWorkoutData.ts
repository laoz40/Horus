import { currentDay } from "./date";
import { WorkoutDbData, WorkoutFormData } from "./types";
import { Workout } from "./validateWorkout";

export const parseWorkout = (workout: WorkoutFormData): Workout => {
	return {
		name: workout.name.trim() || `${currentDay} Workout`,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			global: {
				name: exercise.global.name.trim(),
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

export const normalizeExerciseName = (name: string) => {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
};

export const convertDbToFormData = (
	workout: WorkoutDbData,
): WorkoutFormData => {
	return {
		name: workout.name,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			name: exercise.globalExercise.name,
			global: {
				name: exercise.globalExercise.name,
			},
			difficulty: exercise.difficulty,
			notes: exercise.notes,
			sets: exercise.sets.map((set) => ({
				id: set.id,
				weight: String(set.weight),
				reps: String(set.reps),
			})),
		})),
	};
};
