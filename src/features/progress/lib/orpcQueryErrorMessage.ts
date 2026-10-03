import { isDefinedError } from "@orpc/client";

export function orpcQueryErrorMessage(
	isError: boolean,
	error: Error | null | undefined,
	fallback: string,
) {
	if (!isError) return null;

	if (!isDefinedError(error)) return fallback;

	return fallback;
}
