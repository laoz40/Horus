import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

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

function emptyExercisePrs(): ExercisePrs {
	return {
		weightPr: 0,
		volumePr: 0,
		bodyweightRepsPr: 0,
	};
}

function normalizeSet(set: ComparableSet): ComparableSet {
	return {
		weight: set.weight || 0,
		reps: set.reps || 0,
		completed: set.completed,
	};
}

function isPrSet(currentSet: ComparableSet, currentExercisePr: ExercisePrs): boolean {
	if (!currentSet.completed) return false;

	if (currentSet.weight === 0) {
		return currentSet.reps > currentExercisePr.bodyweightRepsPr;
	}

	const volume = currentSet.weight * currentSet.reps;
	return currentSet.weight > currentExercisePr.weightPr || volume > currentExercisePr.volumePr;
}

function updateExercisePrs(set: ComparableSet, currentExercise: ExercisePrs): ExercisePrs {
	if (!set.completed) return currentExercise;

	return {
		weightPr: Math.max(currentExercise.weightPr, set.weight),
		volumePr: Math.max(currentExercise.volumePr, set.weight * set.reps),
		bodyweightRepsPr: Math.max(currentExercise.bodyweightRepsPr, set.weight === 0 ? set.reps : 0),
	};
}

function getExercisePrReferences(previousSets: PrBaselineSet[]): Map<ExerciseKey, ExercisePrs> {
	const exercisePrs = new Map<ExerciseKey, ExercisePrs>();

	for (const previousSet of previousSets) {
		const set = normalizeSet(previousSet);
		const prsForCurrentExercise =
			exercisePrs.get(previousSet.globalExerciseId) ?? emptyExercisePrs();

		exercisePrs.set(previousSet.globalExerciseId, updateExercisePrs(set, prsForCurrentExercise));
	}

	return exercisePrs;
}

function countTotalPrSetsInWorkout(
	workout: CurrentWorkoutForPr,
	previousSets: PrBaselineSet[],
): number {
	const exercisePrs = getExercisePrReferences(previousSets);
	const exercisesWithHistory = new Set(previousSets.map((set) => set.globalExerciseId));
	let totalPrSets = 0;

	for (const exercise of workout.exercises) {
		let prsForCurrentExercise = exercisePrs.get(exercise.globalExerciseId) ?? emptyExercisePrs();
		let isPreviousExercise = exercisesWithHistory.has(exercise.globalExerciseId);

		for (const set of exercise.sets) {
			const currentSet = normalizeSet(set);
			if (isPreviousExercise && isPrSet(currentSet, prsForCurrentExercise)) {
				totalPrSets += 1;
			}
			prsForCurrentExercise = updateExercisePrs(currentSet, prsForCurrentExercise);
			if (!isPreviousExercise && currentSet.completed) {
				isPreviousExercise = true;
			}
		}

		exercisePrs.set(exercise.globalExerciseId, prsForCurrentExercise);
	}

	return totalPrSets;
}

export async function calculateTotalPrSets(
	ctx: MutationCtx,
	userId: string,
	exercises: WorkoutForPrCalculation[],
): Promise<number> {
	const targetGlobalExerciseIds = new Set(exercises.map((exercise) => exercise.globalExerciseId));
	const targetGlobalExerciseIdsList = [...targetGlobalExerciseIds];

	const previousSets = (
		await Promise.all(
			targetGlobalExerciseIdsList.map((globalExerciseId) =>
				ctx.db
					.query("workoutSets")
					.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (q) =>
						q.eq("userId", userId).eq("globalExerciseId", globalExerciseId).eq("completed", true),
					)
					.collect(),
			),
		)
	)
		.flat()
		.filter((set) => set.globalExerciseId !== undefined)
		.map((set) => ({
			globalExerciseId: set.globalExerciseId as Id<"globalExercises">,
			weight: set.weight,
			reps: set.reps,
			completed: set.completed,
		}));

	return countTotalPrSetsInWorkout(
		{
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
}
