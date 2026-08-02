export type PrType = "weight" | "volume" | "bodyweightReps";

export interface ExercisePrs {
	hasHistory: boolean;
	highestWeight: number;
	highestVolume: number;
	highestBodyweightReps: number;
}

interface PrSet {
	weight: number;
	reps: number;
	completed: boolean;
}

interface PrResult {
	prTypes: PrType[];
	nextRecords: ExercisePrs;
}

export interface PrHistorySet {
	setId: string;
	workoutId: string;
	exerciseId: string;
	weight: number;
	reps: number;
	completed: boolean;
}

export interface PrSetUpdate {
	setId: string;
	workoutId: string;
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}

export const emptyExercisePrs = (): ExercisePrs => ({
	hasHistory: false,
	highestWeight: 0,
	highestVolume: 0,
	highestBodyweightReps: 0,
});

export const calculatePrsForSet = (set: PrSet, currentRecords: ExercisePrs): PrResult => {
	if (!set.completed) {
		return { prTypes: [], nextRecords: currentRecords };
	}

	if (set.weight === 0) {
		const isBodyweightRepsPr =
			currentRecords.hasHistory && set.reps > currentRecords.highestBodyweightReps;

		return {
			prTypes: isBodyweightRepsPr ? ["bodyweightReps"] : [],
			nextRecords: {
				...currentRecords,
				hasHistory: true,
				highestBodyweightReps: Math.max(currentRecords.highestBodyweightReps, set.reps),
			},
		};
	}

	const volume = set.weight * set.reps;
	const prTypes: PrType[] = [];

	if (currentRecords.hasHistory && set.weight > currentRecords.highestWeight) {
		prTypes.push("weight");
	}
	if (currentRecords.hasHistory && volume > currentRecords.highestVolume) {
		prTypes.push("volume");
	}

	return {
		prTypes,
		nextRecords: {
			...currentRecords,
			hasHistory: true,
			highestWeight: Math.max(currentRecords.highestWeight, set.weight),
			highestVolume: Math.max(currentRecords.highestVolume, volume),
		},
	};
};

export const calculatePrHistory = (sets: PrHistorySet[]): PrSetUpdate[] => {
	const recordsByExerciseId = new Map<string, ExercisePrs>();
	const prStatuses: PrSetUpdate[] = [];

	for (const set of sets) {
		const currentRecords = recordsByExerciseId.get(set.exerciseId) ?? emptyExercisePrs();

		const { prTypes, nextRecords } = calculatePrsForSet(set, currentRecords);

		recordsByExerciseId.set(set.exerciseId, nextRecords);

		prStatuses.push({
			setId: set.setId,
			workoutId: set.workoutId,
			isWeightPr: prTypes.includes("weight"),
			isVolumePr: prTypes.includes("volume"),
			isBodyweightRepsPr: prTypes.includes("bodyweightReps"),
		});
	}

	return prStatuses;
};
