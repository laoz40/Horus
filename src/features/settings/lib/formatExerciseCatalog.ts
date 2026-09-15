import { readSelectedCategories } from "@/features/settings/lib/exerciseMuscleCategories";
import { CATEGORY_LABELS } from "@/features/workout-form/lib/muscleGroupCategories";

export function formatMuscleGroups(muscleGroups: string[]): string {
	const categories = readSelectedCategories(muscleGroups);

	if (categories.length === 0) {
		return "(no groups)";
	}

	return categories.map((category) => CATEGORY_LABELS[category]).join(" · ");
}

export function formatWorkoutCount(workoutCount: number): string {
	const label = workoutCount === 1 ? "workout" : "workouts";

	return `${workoutCount} ${label}`;
}
