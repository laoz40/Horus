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

export function deduplicateExercises(
	groupOne: { id: string; name: string; normalizedName: string }[],
	groupTwo: { id: string; name: string; normalizedName: string }[],
) {
	const map = new Map<
		string,
		{ id: string; name: string; normalizedName: string }
	>();

	// TODO: refactor this

	for (const exercise of groupOne) {
		if (!exercise.normalizedName) continue;

		map.set(exercise.normalizedName, {
			id: exercise.id,
			name: exercise.name.trim(),
			normalizedName: exercise.normalizedName,
		});
	}

	for (const exercise of groupTwo) {
		if (!exercise.normalizedName) continue;

		if (!map.has(exercise.normalizedName)) {
			map.set(exercise.normalizedName, {
				id: exercise.id,
				name: exercise.name.trim(),
				normalizedName: exercise.normalizedName,
			});
		}
	}
	return Array.from(map.values());
}

export function toTitleCase(value: string): string {
	return value
		.toLowerCase()
		.split(" ")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}
