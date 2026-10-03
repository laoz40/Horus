import { isDefinedError } from "@orpc/client";

export function orpcQueryErrorMessage(isError: boolean, error: unknown, fallback: string) {
	if (!isError) return null;

	if (!isDefinedError(error)) return fallback;

	return fallback;
}
