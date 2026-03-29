type WorkoutLike = {
	exercises: {
		global: {
			muscleGroups?: string[] | undefined;
		};
	}[];
};

export function getWorkoutMuscleGroups(workout: WorkoutLike): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];

	for (const exercise of workout.exercises) {
		const groups = exercise.global.muscleGroups;
		if (!Array.isArray(groups)) continue;

		for (const group of groups) {
			const trimmedGroup = group.trim().toLowerCase();
			if (trimmedGroup.length === 0) continue;
			if (seen.has(trimmedGroup)) continue;
			seen.add(trimmedGroup);
			unique.push(trimmedGroup);
		}
	}

	return unique;
}
