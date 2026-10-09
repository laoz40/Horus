import "server-only";

import { Effect } from "effect";
import { PrHistoryDb } from "@/server/exercises/pr-history/pr-history.db";
import {
	calculateAffectedPrHistory,
	type PrHistoryCutoff,
	type PrHistorySet,
} from "@/server/exercises/pr-history/pr-history.functions";

export const calculateSetPrsFromHistory = (query: { userId: string; sets: PrHistorySet[] }) =>
	Effect.gen(function* () {
		const db = yield* PrHistoryDb;
		const exerciseIds = [...new Set(query.sets.map((set) => set.exerciseId))];

		const previousPrRows =
			exerciseIds.length === 0
				? []
				: yield* db.getPreviousPrs({ userId: query.userId, exerciseIds });

		return calculateAffectedPrHistory(query.sets, previousPrRows).prStatuses;
	});

export const recalculateExercisePrHistory = (query: {
	userId: string;
	exerciseIds: string[];
	cutoff: PrHistoryCutoff;
}) =>
	Effect.gen(function* () {
		if (query.exerciseIds.length === 0) {
			return;
		}

		const db = yield* PrHistoryDb;
		const previousPrRows = yield* db.getPreviousPrs(query);
		const historySets = yield* db.getAffectedSets(query);

		const { prStatuses, affectedWorkoutIds } = calculateAffectedPrHistory(
			historySets,
			previousPrRows,
		);

		yield* db.updateSetStatuses(prStatuses);
		// Count all sets in touched workouts because unchanged exercises may also contribute PRs.
		yield* db.updateWorkoutTotals({ userId: query.userId, workoutIds: affectedWorkoutIds });
	});
