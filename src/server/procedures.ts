import "server-only";

import { Effect } from "effect";
import { os } from "@orpc/server";

import { auth } from "@/lib/auth-server";

interface ORPCContext {
	headers: Headers;
	requestId: string;
}

const publicProcedure = os.$context<ORPCContext>().use(({ context, path, next }) => {
	return next({
		context: {
			logAnnotations: {
				requestId: context.requestId,
				operation: path.join("."),
			},
		},
	});
});

const baseProcedure = publicProcedure.errors({
	UNAUTHORIZED: {
		message: "Authentication is required",
	},
});

export const protectedProcedure = baseProcedure.use(async ({ context, errors, next }) => {
	const session = await auth.api.getSession({
		headers: context.headers,
	});

	if (!session) {
		throw errors.UNAUTHORIZED();
	}

	return next({
		context: {
			userId: session.user.id,
		},
	});
});

export function logDatabaseError<E>(message: string, cause: unknown, rpcError: E) {
	return Effect.logError(message, { cause }).pipe(Effect.andThen(Effect.fail(rpcError)));
}

export { publicProcedure };
