type WorkoutLike = {
	exercises: {
		global: {
			muscleGroups?: string[] | undefined;
		};
	}[];
};

export const getWorkoutMuscleGroups = (workout: WorkoutLike): string[] => {
	const seen = new Set<string>();
	const unique: string[] = [];

	for (const exercise of workout.exercises) {
		const groups = exercise.global.muscleGroups;
		if (!Array.isArray(groups)) continue;

		for (const group of groups) {
			const normalized = group.trim().toLowerCase();
			if (normalized.length === 0) continue;
			if (seen.has(normalized)) continue;
			seen.add(normalized);
			unique.push(normalized);
		}
	}

	return unique;
};
