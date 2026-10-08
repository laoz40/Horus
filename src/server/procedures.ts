import "server-only";

import { os } from "@orpc/server";

import { auth } from "@/lib/auth-server";

interface ORPCContext {
	headers: Headers;
}

const publicProcedure = os.$context<ORPCContext>();

const baseProcedure = publicProcedure.errors({
	UNAUTHORIZED: {
		message: "Authentication is required",
	},
});

const requireAuthenticatedUser = baseProcedure.middleware(async ({ context, errors, next }) => {
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

export const protectedProcedure = baseProcedure.use(requireAuthenticatedUser);

export { publicProcedure };
