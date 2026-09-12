import { normalizeName } from "@/lib/normalizeName";

export const MUSCLE_GROUP_CATEGORIES = [
	"chest",
	"back",
	"arms",
	"shoulders",
	"legs",
	"core",
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
	biceps: "arms",
	triceps: "arms",
	abdominals: "core",
} satisfies Record<string, MuscleGroupCategory>;

export const CATEGORY_LABELS = {
	chest: "Chest",
	back: "Back",
	legs: "Legs",
	shoulders: "Shoulders",
	arms: "Arms",
	core: "Core",
} satisfies Record<MuscleGroupCategory, string>;

export const getCategoryForMuscleName = (muscleName: string): MuscleGroupCategory | undefined => {
	const normalizedMuscleName = normalizeName(muscleName);

	return Object.entries(RAW_MUSCLE_TO_CATEGORY).find(([key]) => key === normalizedMuscleName)?.[1];
};

export const getNormalizedMuscleNamesForCategory = (category: MuscleGroupCategory): string[] => {
	return Object.entries(RAW_MUSCLE_TO_CATEGORY)
		.filter(([, mappedCategory]) => mappedCategory === category)
		.map(([muscleName]) => muscleName);
};
