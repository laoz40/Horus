import "server-only";

import { eq } from "drizzle-orm";
import { err, ok } from "neverthrow";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

function findUser(userId: string) {
	return tryPromise({
		try: () => db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	}).map(([user]) => user);
}

export function requireUser(userId: string) {
	return findUser(userId).andThen((user) => {
		if (!user) {
			return err({ reason: "USER_NOT_FOUND" as const });
		}

		return ok(user);
	});
}
