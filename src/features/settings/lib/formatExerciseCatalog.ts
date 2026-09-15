import { muscleGroupsToCategories } from "@/features/settings/lib/exerciseCatalogMuscleGroups";
import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";
import { CATEGORY_LABELS } from "@/features/workout-form/lib/muscleGroupCategories";

export function formatMuscleGroups(muscleGroups: string[]): string {
	if (muscleGroups.length === 0) {
		return "(no groups)";
	}

	const categories = muscleGroupsToCategories(muscleGroups);

	if (categories.length > 0) {
		return categories.map((category) => CATEGORY_LABELS[category]).join(" · ");
	}

	return muscleGroups.map((muscleGroup) => toTitleCase(muscleGroup)).join(" · ");
}

export function formatWorkoutCount(workoutCount: number): string {
	const label = workoutCount === 1 ? "workout" : "workouts";

	return `${workoutCount} ${label}`;
}
