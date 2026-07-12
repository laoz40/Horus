import { ConvexError } from "convex/values";
import type { WorkoutFormData, WorkoutForSave } from "../../features/workout-form/lib/types";
import { validateWorkout } from "../../features/workout-form/lib/validateWorkout";
import { getCurrentDay } from "../../lib/date";

function parseWorkout(workout: WorkoutFormData): WorkoutForSave {
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
				...(exercise.difficulty !== undefined ? { difficulty: exercise.difficulty } : {}),
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
}

export function parseAndValidateWorkout(rawWorkout: WorkoutFormData): WorkoutForSave {
	const parsedWorkout = parseWorkout(rawWorkout);
	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		throw new ConvexError({
			code: "INVALID_WORKOUT_DATA",
			issues: validationResult.error.issues.map((issue) => ({
				message: issue.message,
			})),
		});
	}

	return parsedWorkout;
}
