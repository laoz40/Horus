const DIFFICULTY_LEVELS = [
	{ value: 0, label: "Very Easy", className: "text-muted-foreground bg-muted" },
	{ value: 1, label: "Easy", className: "text-foreground bg-secondary" },
	{ value: 2, label: "Average", className: "text-chart-4 bg-chart-4/15" },
	{ value: 3, label: "Challenging", className: "text-challenging bg-challenging/15" },
	{ value: 4, label: "Nightmare", className: "text-destructive bg-destructive/10" },
] as const;

export function getDifficultyLevel(value: number | null | undefined) {
	if (value === null || value === undefined) {
		return null;
	}

	return DIFFICULTY_LEVELS[Math.min(4, Math.max(0, value))];
}
