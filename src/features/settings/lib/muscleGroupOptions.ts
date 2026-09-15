import {
	CATEGORY_LABELS,
	MUSCLE_GROUP_CATEGORIES,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";

export interface MuscleCategoryOption {
	category: MuscleGroupCategory;
	label: string;
}

export const MUSCLE_CATEGORY_OPTIONS: MuscleCategoryOption[] = MUSCLE_GROUP_CATEGORIES.map(
	(category) => ({
		category,
		label: CATEGORY_LABELS[category],
	}),
);
