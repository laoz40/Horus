const DIFFICULTY_LEVELS = [
	{ value: 0, label: "Very Easy" },
	{ value: 1, label: "Easy" },
	{ value: 2, label: "Average" },
	{ value: 3, label: "Challenging" },
	{ value: 4, label: "Nightmare" },
] as const;

export function getDifficultyLevel(value: number | null | undefined) {
	if (value === null || value === undefined) {
		return null;
	}

	return DIFFICULTY_LEVELS[Math.min(4, Math.max(0, value))];
}
