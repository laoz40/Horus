import {
	getCategoryForMuscleName,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";

export function readSelectedCategories(storedMuscleGroups: string[]): MuscleGroupCategory[] {
	const categories = new Set<MuscleGroupCategory>();

	for (const muscleGroup of storedMuscleGroups) {
		const category = getCategoryForMuscleName(muscleGroup);

		if (category) {
			categories.add(category);
		}
	}

	return MUSCLE_GROUP_CATEGORIES.filter((category) => categories.has(category));
}

export function writeSelectedCategories(categories: MuscleGroupCategory[]): string[] {
	return [...categories];
}

export function unionSelectedCategories(
	existingStoredMuscleGroups: string[],
	additionalCategories: MuscleGroupCategory[],
): string[] {
	const mergedCategories = new Set([
		...readSelectedCategories(existingStoredMuscleGroups),
		...additionalCategories,
	]);

	return MUSCLE_GROUP_CATEGORIES.filter((category) => mergedCategories.has(category));
}
