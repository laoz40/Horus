import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";

import { appRouter } from "@/lib/orpc/router";

const handler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

async function handleRequest(request: Request): Promise<Response> {
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context: { headers: request.headers },
	});

	return response ?? new Response("Not found", { status: 404 });
}

export const DELETE = handleRequest;
export const GET = handleRequest;
export const HEAD = handleRequest;
export const PATCH = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
