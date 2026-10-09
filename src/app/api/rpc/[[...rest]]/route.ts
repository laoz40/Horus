import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { Effect } from "effect";

import { appRouter } from "@/server/router";

const handler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error, { context, request }) => {
			if (request.signal?.aborted) return;

			Effect.runSync(
				Effect.logError("RPC request failed", error).pipe(
					Effect.annotateLogs({
						requestId: context.requestId,
						requestPath: request.url.pathname,
					}),
				),
			);
		}),
	],
});

async function handleRequest(request: Request): Promise<Response> {
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context: { headers: request.headers, requestId: crypto.randomUUID() },
	});

	return response ?? new Response("Not found", { status: 404 });
}

export const DELETE = handleRequest;

export const GET = handleRequest;

export const HEAD = handleRequest;

export const PATCH = handleRequest;

export const POST = handleRequest;

export const PUT = handleRequest;
