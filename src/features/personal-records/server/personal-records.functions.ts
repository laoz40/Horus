import type { SetPrType } from "@/features/personal-records/lib/setPr";
import type { ExercisePersonalRecordsRow } from "@/features/personal-records/server/personal-records.db";
import {
	calculatePrsForSet,
	emptyExercisePrs,
	type ExercisePrs,
} from "@/features/personal-records/server/pr-history.functions";

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
