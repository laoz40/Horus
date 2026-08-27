import type { RecentSetRow } from "@/server/services/exercises.db";
import {
	calculatePrsForSet,
	emptyExercisePrs,
	type ExercisePrs,
} from "@/server/services/pr-history.functions";

export type RecentSetPrType = "weight" | "volume" | "bodyweightReps";

interface DraftSet {
	completed: boolean;
	weight?: number;
	reps?: number;
}

export function checkCompletedSetPr(
	sets: DraftSet[],
	setIndex: number,
	initialRecords: ExercisePrs = emptyExercisePrs(),
) {
	let records = initialRecords;

	for (const [index, set] of sets.entries()) {
		const normalizedSet = {
			completed: set.completed,
			weight: set.weight ?? 0,
			reps: set.reps ?? 0,
		};
		const result = calculatePrsForSet(normalizedSet, records);

		if (index === setIndex) {
			return { prType: result.prTypes[0] ?? null };
		}

		records = result.nextRecords;
	}

	return { prType: null };
}

export function buildRecentSets(rows: RecentSetRow[]) {
	return rows.map((row) => {
		const prTypes: RecentSetPrType[] = [];

		if (row.isWeightPr) prTypes.push("weight");
		if (row.isVolumePr) prTypes.push("volume");
		if (row.isBodyweightRepsPr) prTypes.push("bodyweightReps");

		return {
			weight: row.weight,
			reps: row.reps,
			completedAtMs: row.completedAtMs,
			isPr: prTypes.length > 0,
			prTypes,
		};
	});
}
