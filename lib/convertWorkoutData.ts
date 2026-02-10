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
				weight: Number(set.weight) ?? 0,
				reps: Number(set.reps),
				completed: set.completed ?? false,
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
			global: {
				name: toTitleCase(exercise.globalExercise.name),
			},
			difficulty:
				exercise.difficulty === null ? undefined : exercise.difficulty,
			notes: exercise.notes === null ? undefined : exercise.notes,
			sets: exercise.sets.map((set) => ({
				id: set.id,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
			})),
		})),
	};
};

interface fetchedExercise {
	id: string;
	name: string;
	normalizedName: string;
}

export const deduplicateExercises = (
	groupOne: fetchedExercise[],
	groupTwo: fetchedExercise[],
) => {
	const map = new Map<string, fetchedExercise>();

	const addIfMissing = (exercise: fetchedExercise, addAll: boolean) => {
		if (!exercise.normalizedName) return;

		const exerciseMissing = !map.has(exercise.normalizedName);
		if (addAll || exerciseMissing) {
			map.set(exercise.normalizedName, {
				id: exercise.id,
				name: exercise.name.trim(),
				normalizedName: exercise.normalizedName,
			});
		}
	};

	for (const exercise of groupOne) addIfMissing(exercise, true);
	for (const exercise of groupTwo) addIfMissing(exercise, false);

	return Array.from(map.values());
};

export const toTitleCase = (value: string): string => {
	return value
		.toLowerCase()
		.split(" ")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
};

export const createSuggestionObject = (exercise: {
	id: string;
	name: string;
	normalizedName?: string;
}) => ({
		id: exercise.id,
		name: toTitleCase(exercise.name),
		normalizedName: exercise.normalizedName ?? normalizeExerciseName(exercise.name),
	})
