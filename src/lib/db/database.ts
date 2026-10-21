import "server-only";

import { Data, Effect } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	readonly cause: unknown;
}> {}

export const withDatabaseError = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
	effect.pipe(
		Effect.mapError((cause) => {
			if (cause instanceof DatabaseError) {
				return cause;
			}

			return new DatabaseError({ cause });
		}),
	);
