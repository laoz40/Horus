import "server-only";

import { runDatabaseTransaction } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";
import { requireUser } from "@/server/services/lib/users";
import {
	getPrHistorySets,
	getWorkoutCount,
	updateSetPrStatuses,
	updateWorkoutPrTotals,
} from "@/server/services/pr-history.db";
import {
	buildPrTotalsByWorkoutId,
	calculatePrHistory,
	summarizePrHistory,
} from "@/server/services/pr-history.functions";

function rebuildAllPrHistory(userId: string) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx) => {
				const workoutCount = await getWorkoutCount(tx, userId);
				const historySets = await getPrHistorySets(tx, userId);
				const prStatuses = calculatePrHistory(historySets);
				const totalsByWorkoutId = buildPrTotalsByWorkoutId(prStatuses);

				await updateSetPrStatuses(tx, prStatuses);
				await updateWorkoutPrTotals(tx, userId);

				return summarizePrHistory(workoutCount, prStatuses, totalsByWorkoutId);
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function rebuildPrHistory(userId: string) {
	return requireUser(userId).andThen(() => rebuildAllPrHistory(userId));
}
