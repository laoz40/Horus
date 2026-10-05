import "server-only";

import type { DatabaseTransaction } from "@/lib/db";
import {
	getAffectedPrHistorySets,
	getExercisePrRowsByIds,
	updateSetPrStatuses,
	updateWorkoutPrTotals,
} from "@/server/services/pr-history.db";
import {
	calculateAffectedPrHistory,
	type ExercisePrRow,
	type PrHistoryCutoff,
	type PrHistorySet,
	type PrSetUpdate,
} from "@/server/services/pr-history.functions";

type Tx = DatabaseTransaction;

export async function calculateSetPrsFromHistory(
	tx: Tx,
	userId: string,
	sets: PrHistorySet[],
): Promise<PrSetUpdate[]> {
	const exerciseIds = [...new Set(sets.map((set) => set.exerciseId))];

	const previousPrRows: ExercisePrRow[] =
		exerciseIds.length === 0 ? [] : await getExercisePrRowsByIds(tx, userId, exerciseIds);

	return calculateAffectedPrHistory(sets, previousPrRows).prStatuses;
}

export async function recalculateExercisePrHistory(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
	cutoff: PrHistoryCutoff,
): Promise<void> {
	if (exerciseIds.length === 0) {
		return;
	}

	const previousPrRows = await getExercisePrRowsByIds(tx, userId, exerciseIds, cutoff);
	const historySets = await getAffectedPrHistorySets(tx, userId, exerciseIds, cutoff);

	const { prStatuses, affectedWorkoutIds } = calculateAffectedPrHistory(
		historySets,
		previousPrRows,
	);

	await updateSetPrStatuses(tx, prStatuses);
	// Count all sets in touched workouts because unchanged exercises may also contribute PRs.
	await updateWorkoutPrTotals(tx, userId, affectedWorkoutIds);
}
