import "server-only";

import { rebuildPrHistoryTx } from "@/server/services/pr-history.db";
import { requireUserForPrRebuild } from "@/server/services/pr-history.functions";

export function rebuildPrHistory(userId: string) {
	return requireUserForPrRebuild(userId).andThen(() => rebuildPrHistoryTx(userId));
}
