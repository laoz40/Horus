import {
	markExerciseWeightProgressionPeriodPeaks,
	type ExerciseWeightProgressionPoint,
} from "@/features/progress/lib/exerciseWeightProgression";
import type {
	ExercisePersonalRecordsRow,
	RecentSetRow,
	WeeklyWeightProgressionRow,
} from "@/server/exercises/progress/progress.repository";
import type { SetPrType } from "@/features/workout-form/lib/setPr";
import {
	calculatePrsForSet,
	emptyExercisePrs,
	type ExercisePrs,
} from "@/server/exercises/pr-history/pr-history.functions";

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

const personalRecordEntries: {
	type: SetPrType;
	key: keyof Pick<ExercisePersonalRecordsRow, "weight" | "volume" | "bodyweightReps">;
}[] = [
	{ type: "weight", key: "weight" },
	{ type: "volume", key: "volume" },
	{ type: "bodyweightReps", key: "bodyweightReps" },
];

export function buildExercisePersonalRecords(row: ExercisePersonalRecordsRow) {
	const records: {
		type: SetPrType;
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	}[] = [];

	for (const entry of personalRecordEntries) {
		const record = row[entry.key];

		if (!record) continue;

		records.push({
			type: entry.type,
			...record,
		});
	}

	return {
		hasHistory: row.hasHistory,
		records,
	};
}

export function buildWeeklyWeightProgression(
	rows: WeeklyWeightProgressionRow[],
): ExerciseWeightProgressionPoint[] {
	return markExerciseWeightProgressionPeriodPeaks(rows);
}

export function buildRecentSets(rows: RecentSetRow[]) {
	return rows.map((row) => {
		const prTypes: SetPrType[] = [];

		if (row.isWeightPr) prTypes.push("weight");

		if (row.isVolumePr) prTypes.push("volume");

		if (row.isBodyweightRepsPr) prTypes.push("bodyweightReps");

		return {
			id: row.id,
			weight: row.weight,
			reps: row.reps,
			completedAtMs: row.completedAtMs,
			isPr: prTypes.length > 0,
			prTypes,
		};
	});
}
