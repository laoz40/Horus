import type { Id } from "../_generated/dataModel";

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
