import "server-only";

import { err, ok } from "neverthrow";
import { findUser } from "@/server/services/pr-history.db";

export function requireUserForPrRebuild(userId: string) {
	return findUser(userId).andThen((user) => {
		if (!user) {
			return err({ reason: "USER_NOT_FOUND" as const });
		}

		return ok(user);
	});
}
