import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthenticatedCtx = MutationCtx | QueryCtx;

export async function requireIdentity(
	ctx: AuthenticatedCtx,
): Promise<NonNullable<Awaited<ReturnType<AuthenticatedCtx["auth"]["getUserIdentity"]>>>> {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		throw new ConvexError({ code: "UNAUTHORIZED" });
	}

	return identity;
}

export async function errorHandlerWrapper<T>(operation: () => Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof ConvexError) {
			throw error;
		}

		throw new ConvexError({ code: "DB_QUERY_FAILED" });
	}
}
