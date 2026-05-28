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

export interface ExercisePrs {
	weightPr: number;
	volumePr: number;
	bodyweightRepsPr: number;
}

export interface ExercisePrSummary extends ExercisePrs {
	weightPrSetId: Id<"workoutSets"> | null;
	volumePrSetId: Id<"workoutSets"> | null;
	bodyweightRepsPrSetId: Id<"workoutSets"> | null;
}

export interface SetPrResult {
	isPr: boolean;
	prType: "weight" | "volume" | "bodyweightReps" | null;
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

export function emptyExercisePrs(): ExercisePrs {
	return {
		weightPr: 0,
		volumePr: 0,
		bodyweightRepsPr: 0,
	};
}

export function emptyExercisePrSummary(): ExercisePrSummary {
	return {
		...emptyExercisePrs(),
		weightPrSetId: null,
		volumePrSetId: null,
		bodyweightRepsPrSetId: null,
	};
}

export function hasExercisePrHistory(summary: ExercisePrSummary): boolean {
	return Boolean(summary.weightPrSetId ?? summary.volumePrSetId ?? summary.bodyweightRepsPrSetId);
}

function emptySetPrResult(): SetPrResult {
	return {
		isPr: false,
		prType: null,
	};
}

export function normalizePrSet(set: ComparableSet): ComparableSet {
	return {
		weight: set.weight || 0,
		reps: set.reps || 0,
		completed: set.completed,
	};
}

export function getSetPrResult(
	currentSet: ComparableSet,
	currentExercisePr: ExercisePrs,
): SetPrResult {
	if (!currentSet.completed) return emptySetPrResult();

	if (currentSet.weight === 0) {
		return currentSet.reps > currentExercisePr.bodyweightRepsPr
			? { isPr: true, prType: "bodyweightReps" }
			: emptySetPrResult();
	}

	const volume = currentSet.weight * currentSet.reps;
	if (currentSet.weight > currentExercisePr.weightPr) {
		return {
			isPr: true,
			prType: "weight",
		};
	}

	if (volume > currentExercisePr.volumePr) {
		return {
			isPr: true,
			prType: "volume",
		};
	}

	return emptySetPrResult();
}

export function isPrSet(currentSet: ComparableSet, currentExercisePr: ExercisePrs): boolean {
	return getSetPrResult(currentSet, currentExercisePr).isPr;
}

export function getWorkoutSetPrResults(
	previousSets: PrBaselineSet[],
	globalExerciseId: ExerciseKey,
	sets: ComparableSet[],
): SetPrResult[] {
	const exercisePrs = getExercisePrReferences(previousSets);
	let currentExercisePrs = exercisePrs.get(globalExerciseId) ?? emptyExercisePrs();
	let hasPreviousHistory = previousSets.some((set) => set.globalExerciseId === globalExerciseId);

	return sets.map((set) => {
		const currentSet = normalizePrSet(set);
		const result = hasPreviousHistory
			? getSetPrResult(currentSet, currentExercisePrs)
			: emptySetPrResult();

		currentExercisePrs = updateExercisePrs(currentSet, currentExercisePrs);
		if (!hasPreviousHistory && currentSet.completed) {
			hasPreviousHistory = true;
		}

		return result;
	});
}

export function updateExercisePrs(set: ComparableSet, currentExercise: ExercisePrs): ExercisePrs {
	if (!set.completed) return currentExercise;

	return {
		weightPr: Math.max(currentExercise.weightPr, set.weight),
		volumePr: Math.max(currentExercise.volumePr, set.weight * set.reps),
		bodyweightRepsPr: Math.max(currentExercise.bodyweightRepsPr, set.weight === 0 ? set.reps : 0),
	};
}

export function updateExercisePrSummary(
	set: ComparableSet,
	setId: Id<"workoutSets">,
	currentExercise: ExercisePrSummary,
): ExercisePrSummary {
	if (!set.completed) return currentExercise;

	const volume = set.weight * set.reps;

	return {
		weightPr: set.weight > currentExercise.weightPr ? set.weight : currentExercise.weightPr,
		weightPrSetId: set.weight > currentExercise.weightPr ? setId : currentExercise.weightPrSetId,
		volumePr: volume > currentExercise.volumePr ? volume : currentExercise.volumePr,
		volumePrSetId: volume > currentExercise.volumePr ? setId : currentExercise.volumePrSetId,
		bodyweightRepsPr:
			set.weight === 0 && set.reps > currentExercise.bodyweightRepsPr
				? set.reps
				: currentExercise.bodyweightRepsPr,
		bodyweightRepsPrSetId:
			set.weight === 0 && set.reps > currentExercise.bodyweightRepsPr
				? setId
				: currentExercise.bodyweightRepsPrSetId,
	};
}

export function getPrPatchFields(result: SetPrResult) {
	return {
		isPr: result.isPr,
		prType: result.prType,
		isCurrentWeightPr: false,
		isCurrentVolumePr: false,
		isCurrentBodyweightRepsPr: false,
	};
}

export function getExercisePrReferences(
	previousSets: PrBaselineSet[],
): Map<ExerciseKey, ExercisePrs> {
	const exercisePrs = new Map<ExerciseKey, ExercisePrs>();

	for (const previousSet of previousSets) {
		const set = normalizePrSet(previousSet);
		const prsForCurrentExercise =
			exercisePrs.get(previousSet.globalExerciseId) ?? emptyExercisePrs();

		exercisePrs.set(previousSet.globalExerciseId, updateExercisePrs(set, prsForCurrentExercise));
	}

	return exercisePrs;
}

export function calculateSetPrResult(
	previousSets: PrBaselineSet[],
	globalExerciseId: ExerciseKey,
	sets: ComparableSet[],
	targetSetIndex: number,
): SetPrResult {
	const targetSet = getWorkoutSetPrResults(previousSets, globalExerciseId, sets)[targetSetIndex];
	return targetSet ?? emptySetPrResult();
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
			const currentSet = normalizePrSet(set);
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
	options?: { excludeWorkoutId?: Id<"workouts"> },
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
		.filter(
			(set) => set.globalExerciseId !== undefined && set.workoutId !== options?.excludeWorkoutId,
		)
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
