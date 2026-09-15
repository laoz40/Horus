import {
	getCategoryForMuscleName,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";

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

export function unionMuscleGroupNames(existing: string[], additional: string[]): string[] {
	const muscleGroupsByNormalizedName = new Map<string, string>();

	for (const name of [...existing, ...additional]) {
		const normalizedName = normalizeName(name);

		if (normalizedName.length === 0 || muscleGroupsByNormalizedName.has(normalizedName)) {
			continue;
		}

		muscleGroupsByNormalizedName.set(normalizedName, name.trim());
	}

	return [...muscleGroupsByNormalizedName.values()];
}
