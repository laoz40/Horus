import { isDefinedError } from "@orpc/client";

import { orpc } from "@/lib/orpc/client";

// Retry transient failures up to 2 times (3 attempts total); skip NOT_FOUND and UNAUTHORIZED.
export function workoutByIdQueryOptions(workoutId: string) {
	return orpc.workouts.getById.queryOptions({
		input: { id: workoutId },
		retry: (failureCount, error) => {
			if (!isDefinedError(error)) {
				return failureCount < 2;
			}

			switch (error.code) {
				case "DATABASE_ERROR":
					return failureCount < 2;
				case "NOT_FOUND":
				case "UNAUTHORIZED":
					return false;
				default: {
					const exhaustiveError: never = error;

					return exhaustiveError;
				}
			}
		},
	});
}
