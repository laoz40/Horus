import { isDefinedError } from "@orpc/client";
import { Match } from "effect";

import { orpc } from "@/lib/orpc/client";

// Retry transient failures up to 2 times (3 attempts total); skip NOT_FOUND and UNAUTHORIZED.
export function workoutByIdQueryOptions(workoutId: string) {
	return orpc.workouts.getById.queryOptions({
		input: { id: workoutId },
		retry: (failureCount, error) => {
			if (!isDefinedError(error)) {
				return failureCount < 2;
			}

			return Match.value(error).pipe(
				Match.when({ code: "DATABASE_ERROR" }, () => failureCount < 2),
				Match.when({ code: "NOT_FOUND" }, () => false),
				Match.when({ code: "UNAUTHORIZED" }, () => false),
				Match.exhaustive,
			);
		},
	});
}
