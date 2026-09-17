import { normalizeName } from "@/lib/normalizeName";

export const MUSCLE_GROUP_CATEGORIES = [
	"chest",
	"back",
	"shoulders",
	"core",
	"biceps",
	"triceps",
	"glutes",
	"legs",
] as const;

export type MuscleGroupCategory = (typeof MUSCLE_GROUP_CATEGORIES)[number];

const RAW_MUSCLE_TO_CATEGORY = {
	chest: "chest",
	"upper chest": "chest",
	lats: "back",
	"upper back": "back",
	"lower back": "back",
	trapezius: "back",
	quadriceps: "legs",
	hamstrings: "legs",
	calves: "legs",
	deltoids: "shoulders",
	biceps: "biceps",
	triceps: "triceps",
	"gluteus maximus": "glutes",
	abdominals: "core",
} satisfies Record<string, MuscleGroupCategory>;

export const CATEGORY_LABELS = {
	chest: "Chest",
	back: "Back",
	shoulders: "Shoulders",
	biceps: "Biceps",
	triceps: "Triceps",
	legs: "Legs",
	glutes: "Glutes",
	core: "Core",
} satisfies Record<MuscleGroupCategory, string>;

export const getCategoryForMuscleName = (muscleName: string): MuscleGroupCategory | undefined => {
	const normalizedMuscleName = normalizeName(muscleName);

	for (const category of MUSCLE_GROUP_CATEGORIES) {
		if (category === normalizedMuscleName) {
			return category;
		}
	}

	return Object.entries(RAW_MUSCLE_TO_CATEGORY).find(([key]) => key === normalizedMuscleName)?.[1];
};

export const getNormalizedMuscleNamesForCategory = (category: MuscleGroupCategory): string[] => {
	const muscleNames = Object.entries(RAW_MUSCLE_TO_CATEGORY)
		.filter(([, mappedCategory]) => mappedCategory === category)
		.map(([muscleName]) => muscleName);

	if (muscleNames.includes(category)) {
		return muscleNames;
	}

	return [category, ...muscleNames];
};
