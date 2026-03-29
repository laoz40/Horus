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

const isPrSet = (currentSet: ComparableSet, currentExercisePr: ExercisePrs): boolean => {
	if (!currentSet.completed) return false;

	// if true, then bodyweight reps pr
	if (currentSet.weight === 0) {
		return currentSet.reps > currentExercisePr.bodyweightRepsPr;
	}

	// if true, then weight pr or volume pr
	const volume = currentSet.weight * currentSet.reps;
	return currentSet.weight > currentExercisePr.weightPr || volume > currentExercisePr.volumePr;
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
		const prsForCurrentExercise =
			exercisePrs.get(previousSet.globalExerciseId) ?? emptyExercisePrs();

		exercisePrs.set(previousSet.globalExerciseId, updateExercisePrs(set, prsForCurrentExercise));
	}

	return exercisePrs;
};

const countTotalPrSetsInWorkout = (
	workout: CurrentWorkoutForPr,
	previousSets: PrBaselineSet[],
): number => {
	const exercisePrs = getExercisePrReferences(previousSets);
	// map for exercises that have at least one completed set in previous workouts
	const exercisesWithHistory = new Set(previousSets.map((set) => set.globalExerciseId));
	let totalPrSets = 0;

	for (const exercise of workout.exercises) {
		// get prs for current exercise
		let prsForCurrentExercise = exercisePrs.get(exercise.globalExerciseId) ?? emptyExercisePrs();
		// if false, then baseline for current exercise is set to 0
		let isPreviousExercise = exercisesWithHistory.has(exercise.globalExerciseId);

		// count for each set in exercise
		for (const set of exercise.sets) {
			const currentSet = normalizeSet(set);
			if (isPreviousExercise && isPrSet(currentSet, prsForCurrentExercise)) {
				totalPrSets += 1;
			}
			prsForCurrentExercise = updateExercisePrs(currentSet, prsForCurrentExercise);
			// first completed set in a new exercise creates baseline for later sets
			if (!isPreviousExercise && currentSet.completed) {
				isPreviousExercise = true;
			}
		}
		// update for each exercise
		exercisePrs.set(exercise.globalExerciseId, prsForCurrentExercise);
	}
	return totalPrSets;
};

export const calculateTotalPrSets = async (
	ctx: MutationCtx,
	userId: string,
	exercises: WorkoutForPrCalculation[],
): Promise<number> => {
	// fetch exercises from the current workout that exist in the global exercises table
	const targetGlobalExerciseIds = new Set(exercises.map((exercise) => exercise.globalExerciseId));
	const targetGlobalExerciseIdsList = [...targetGlobalExerciseIds];

	// fetch workoutExercise rows for this user scoped to the target global exercises
	const previousWorkoutExercises = (
		await Promise.all(
			targetGlobalExerciseIdsList.map((globalExerciseId) =>
				ctx.db
					.query("workoutExercises")
					.withIndex("by_userId_globalExerciseId", (q) =>
						q.eq("userId", userId).eq("globalExerciseId", globalExerciseId),
					)
					.collect(),
			),
		)
	).flat();

	// fetch sets for each workoutExercise row
	const previousSetsByExercise = await Promise.all(
		previousWorkoutExercises.map(async (exercise) => {
			const exerciseSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_workoutExerciseId", (q) => q.eq("workoutExerciseId", exercise._id))
				.collect();

			// return only completed sets
			return exerciseSets
				.filter((set) => set.completed)
				.map((set) => ({
					globalExerciseId: exercise.globalExerciseId,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
				}));
		}),
	);
	const previousSets = previousSetsByExercise.flat();

	// return the number of PR sets in the current workout
	return countTotalPrSetsInWorkout(
		{
			// Normalize current workout set values before running PR detection
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
