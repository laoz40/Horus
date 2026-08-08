import "server-only";

import { requireUser } from "@/server/services/lib/users";
import { rebuildPrHistoryTx } from "@/server/services/pr-history.db";

export function rebuildPrHistory(userId: string) {
	return requireUser(userId).andThen(() => rebuildPrHistoryTx(userId));
}
