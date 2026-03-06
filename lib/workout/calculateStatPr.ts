import type { MutationCtx } from "../../convex/_generated/server";
import type { Id } from "../../convex/_generated/dataModel";

type ExerciseKey = string | Id<"globalExercises">;

interface WorkoutForPrCalculation {
	globalExerciseId: Id<"globalExercises">;
	sets: {
		weight: number;
		reps: number;
		completed: boolean;
	}[];
}

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
	globalExerciseId: ExerciseKey;
}

interface CurrentWorkoutForPr {
	exercises: {
		globalExerciseId: ExerciseKey;
		sets: ComparableSet[];
	}[];
}

const emptyExercisePrs = (): ExercisePrs => ({
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

	// if true, then bodyweight reps pr
	if (set.weight === 0) {
		return set.reps > currentExercise.bodyweightRepsPr;
	}

	// if true, then weight pr or volume pr
	const volume = set.weight * set.reps;
	return set.weight > currentExercise.weightPr || volume > currentExercise.volumePr;
};

const updateExercisePrs = (set: ComparableSet, currentExercise: ExercisePrs): ExercisePrs => {
	if (!set.completed) return currentExercise;

	return {
		weightPr: Math.max(currentExercise.weightPr, set.weight),
		volumePr: Math.max(currentExercise.volumePr, set.weight * set.reps),
		bodyweightRepsPr: Math.max(currentExercise.bodyweightRepsPr, set.weight === 0 ? set.reps : 0),
	};
};

// build a reference map of exercise prs from previous workouts
const getExercisePrReferences = (previousSets: PrBaselineSet[]): Map<ExerciseKey, ExercisePrs> => {
	const exercisePrs = new Map<ExerciseKey, ExercisePrs>();

	for (const previousSet of previousSets) {
		const set = normalizeSet(previousSet);
		const currentExercisePrs = exercisePrs.get(previousSet.globalExerciseId) ?? emptyExercisePrs();

		exercisePrs.set(previousSet.globalExerciseId, updateExercisePrs(set, currentExercisePrs));
	}

	return exercisePrs;
};

const countTotalPrSetsInWorkout = (
	workout: CurrentWorkoutForPr,
	previousSets: PrBaselineSet[],
): number => {
	const exercisePrs = getExercisePrReferences(previousSets);
	let totalPrSets = 0;

	for (const exercise of workout.exercises) {
		// get prs for exercise
		let currentExercisePrs = exercisePrs.get(exercise.globalExerciseId) ?? emptyExercisePrs();
		// count for each set in exercise
		for (const set of exercise.sets) {
			const normalizedSet = normalizeSet(set);
			if (isPrSet(normalizedSet, currentExercisePrs)) {
				totalPrSets += 1;
			}
			currentExercisePrs = updateExercisePrs(normalizedSet, currentExercisePrs);
		}
		// update for each exercise
		exercisePrs.set(exercise.globalExerciseId, currentExercisePrs);
	}
	return totalPrSets;
};

export const calculateTotalPrSets = async (
	ctx: MutationCtx,
	exercises: WorkoutForPrCalculation[],
): Promise<number> => {
	const previousWorkouts = await ctx.db.query("workouts").collect();
	// use ids from the current workout only
	const targetGlobalExerciseIds = new Set(exercises.map((exercise) => exercise.globalExerciseId));

	// make list of completed old sets for matching exercises
	const previousSets = previousWorkouts.flatMap((previousWorkout) =>
		previousWorkout.exercises.flatMap((exercise) =>
			// if exercise is in current workout, keep completed sets, else skip
			targetGlobalExerciseIds.has(exercise.globalExerciseId)
				? exercise.sets
						.filter((set) => set.completed)
						.map((set) => ({
							globalExerciseId: exercise.globalExerciseId,
							weight: set.weight,
							reps: set.reps,
							completed: set.completed,
						}))
				: [],
		),
	);

	return countTotalPrSetsInWorkout(
		{
			// current workout
			exercises: exercises.map((exercise) => ({
				globalExerciseId: exercise.globalExerciseId,
				sets: exercise.sets.map((set) => ({
					weight: Number(set.weight) || 0,
					reps: Number(set.reps) || 0,
					completed: set.completed ?? false,
				})),
			})),
		},
		previousSets,
	);
};
