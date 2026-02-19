export const calculateWorkoutVolume = (workout: {
	exercises: {
		sets: { weight: unknown; reps: unknown; completed: boolean }[];
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

interface PrComparableWorkout {
	exercises: {
		globalExerciseId: string;
		sets: {
			weight: number;
			reps: number;
			completed: boolean;
		}[];
	}[];
};

interface exercisePr {
	weightPr: number;
	volumePr: number;
	bodyweightRepsPr: number;
};

export const calculateWorkoutPrs = <T extends PrComparableWorkout>(
	workouts: T[],
): (T & { totalPrSets: number })[] => {
	const exercisePrs = new Map<string, exercisePr>();
	const workoutsWithPrs: (T & { totalPrSets: number })[] = [];

	for (const workout of workouts) {
		let totalPrSets = 0;

		for (const exercise of workout.exercises) {
			const current = exercisePrs.get(exercise.globalExerciseId) ?? {
				weightPr: 0,
				volumePr: 0,
				bodyweightRepsPr: 0,
			};

			for (const set of exercise.sets) {
				if (!set.completed) continue;
				const weight = set.weight || 0;
				const reps = set.reps || 0;
				const volume = weight * reps;

				let isPr = false;
				if (weight === 0) {
					if (reps > current.bodyweightRepsPr) isPr = true;
				} else if (weight > current.weightPr || volume > current.volumePr) {
					isPr = true;
				}

				if (isPr) {
					totalPrSets += 1;
				}

				current.weightPr = Math.max(current.weightPr, weight);
				current.volumePr = Math.max(current.volumePr, volume);
				current.bodyweightRepsPr = Math.max(current.bodyweightRepsPr, reps);

				exercisePrs.set(exercise.globalExerciseId, current);
			}
		}

		workoutsWithPrs.push({ ...workout, totalPrSets });
	}

	return workoutsWithPrs;
};
