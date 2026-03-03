interface VolumeSet {
	weight?: number;
	reps?: number;
	completed: boolean;
}

export const calculateWorkoutVolume = (workout: {
	exercises: {
		sets: VolumeSet[];
	}[];
}): number => {
	let total = 0;
	for (const exercise of workout.exercises) {
		for (const set of exercise.sets) {
			if (!set.completed) continue;
			const weight = Number(set.weight) || 0;
			const reps = Number(set.reps) || 0;
			total += weight * reps;
		}
	}
	return total;
};
