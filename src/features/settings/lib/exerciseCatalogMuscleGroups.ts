import {
	getCategoryForMuscleName,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";

export function muscleGroupsToCategories(muscleGroups: string[]): MuscleGroupCategory[] {
	const categories = new Set<MuscleGroupCategory>();

	for (const muscleGroup of muscleGroups) {
		const category = getCategoryForMuscleName(muscleGroup);

		if (category) {
			categories.add(category);
		}
	}

	return MUSCLE_GROUP_CATEGORIES.filter((category) => categories.has(category));
}

export function categoriesToMuscleGroups(categories: MuscleGroupCategory[]): string[] {
	return [...categories];
}
