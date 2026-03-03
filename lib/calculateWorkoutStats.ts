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

interface ExercisePrs {
	weightPr: number;
	volumePr: number;
	bodyweightRepsPr: number;
}

interface ComparableSet {
	weight: number;
	reps: number;
	completed: boolean;
}

interface PrBaselineSet extends ComparableSet {
	globalExerciseId: string;
}

interface CurrentWorkoutForPr {
	exercises: {
		globalExerciseId: string;
		sets: ComparableSet[];
	}[];
}

const getEmptyExercisePrs = (): ExercisePrs => ({
	weightPr: 0,
	volumePr: 0,
	bodyweightRepsPr: 0,
});

const normalizeSet = (set: ComparableSet): ComparableSet => ({
	weight: set.weight || 0,
	reps: set.reps || 0,
	completed: set.completed,
});

const isPrSet = (set: ComparableSet, currentExercise: ExercisePrs): boolean => {
	if (!set.completed) return false;

	if (set.weight === 0) {
		return set.reps > currentExercise.bodyweightRepsPr;
	}

	const volume = set.weight * set.reps;
	return (
		set.weight > currentExercise.weightPr || volume > currentExercise.volumePr
	);
};

const updateExercisePrs = (
	set: ComparableSet,
	currentExercise: ExercisePrs,
): ExercisePrs => {
	if (!set.completed) return currentExercise;

	const volume = set.weight * set.reps;

	return {
		weightPr: Math.max(currentExercise.weightPr, set.weight),
		volumePr: Math.max(currentExercise.volumePr, volume),
		bodyweightRepsPr:
			set.weight === 0
				? Math.max(currentExercise.bodyweightRepsPr, set.reps)
				: currentExercise.bodyweightRepsPr,
	};
};

const mapExercisePrs = (
	previousSets: PrBaselineSet[],
): Map<string, ExercisePrs> => {
	const exercisePrs = new Map<string, ExercisePrs>();

	for (const previousSet of previousSets) {
		const set = normalizeSet(previousSet);
		const currentExercise =
			exercisePrs.get(previousSet.globalExerciseId) ?? getEmptyExercisePrs();

		exercisePrs.set(
			previousSet.globalExerciseId,
			updateExercisePrs(set, currentExercise),
		);
	}

	return exercisePrs;
};

export const countTotalPrSetsInWorkout = (
	workout: CurrentWorkoutForPr,
	previousSets: PrBaselineSet[],
): number => {
	const exercisePrs = mapExercisePrs(previousSets);
	let totalPrSets = 0;

	for (const exercise of workout.exercises) {
		let currentExercise =
			exercisePrs.get(exercise.globalExerciseId) ?? getEmptyExercisePrs();

		for (const workoutSet of exercise.sets) {
			const set = normalizeSet(workoutSet);

			if (isPrSet(set, currentExercise)) {
				totalPrSets += 1;
			}

			currentExercise = updateExercisePrs(set, currentExercise);
		}

		exercisePrs.set(exercise.globalExerciseId, currentExercise);
	}

	return totalPrSets;
};
