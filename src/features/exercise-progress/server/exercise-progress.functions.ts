import {
	markExerciseWeightProgressionPeriodPeaks,
	type ExerciseWeightProgressionPoint,
} from "@/features/exercise-progress/lib/exerciseWeightProgression";
import type {
	RecentSetRow,
	WeeklyWeightProgressionRow,
} from "@/features/exercise-progress/server/exercise-progress.db";
import type { SetPrType } from "@/features/personal-records/lib/setPr";

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
