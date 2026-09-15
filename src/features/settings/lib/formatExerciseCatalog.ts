import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";

export function formatMuscleGroups(muscleGroups: string[]): string {
	if (muscleGroups.length === 0) {
		return "(no groups)";
	}

	return muscleGroups.map((muscleGroup) => toTitleCase(muscleGroup)).join(" · ");
}

export function formatWorkoutCount(workoutCount: number): string {
	const label = workoutCount === 1 ? "workout" : "workouts";

	return `${workoutCount} ${label}`;
}
