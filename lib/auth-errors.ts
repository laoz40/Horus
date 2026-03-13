import { ConvexError } from "convex/values";

export function isConvexUnauthorizedError(error: unknown): boolean {
	return error instanceof ConvexError && error.data?.code === "UNAUTHORIZED";
}
