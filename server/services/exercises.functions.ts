import type { RecentSetRow } from "@/server/services/exercises.db";

export type RecentSetPrType = "weight" | "volume" | "bodyweightReps";

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
