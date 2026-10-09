import "server-only";

import { Cause, Context, Effect, Exit, Layer, References } from "effect";
import { prisma } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";
import { DatabaseError } from "@/lib/db/database";
import { ExerciseDb, exerciseDbLayer } from "@/server/exercises/library/exercises.db";
import { PrHistoryDb, prHistoryDb } from "@/server/exercises/pr-history/pr-history.db";
import { WorkoutDb, workoutDbLayer } from "@/server/workouts/workouts.db";

function runTransaction<A, E>(
	workflow: Effect.Effect<A, E, WorkoutDb | PrHistoryDb | ExerciseDb>,
): Effect.Effect<A, E | DatabaseError> {
	return Effect.flatMap(References.CurrentLogAnnotations, (logAnnotations) => {
		let workflowFailure: Cause.Cause<E> | undefined;

		return Effect.tryPromise({
			try: (signal) =>
				prisma.$transaction(async (connection) => {
					const exit = await Effect.runPromiseExit(
						workflow.pipe(
							Effect.provide(Layer.mergeAll(workoutDbLayer, prHistoryDb, exerciseDbLayer)),
							Effect.provideService(DbConnection, connection),
							Effect.annotateLogs(logAnnotations),
						),
						{ signal },
					);

					// Reject the Prisma callback to roll back, then restore the original Effect cause.
					if (Exit.isFailure(exit)) {
						workflowFailure = exit.cause;
						throw new Error("Transaction workflow failed");
					}

					signal.throwIfAborted();

					return exit.value;
				}),
			catch: (cause): Cause.Cause<E | DatabaseError> =>
				workflowFailure ?? Cause.fail(new DatabaseError({ cause })),
		}).pipe(Effect.catch(Effect.failCause));
	});
}

export class Transactions extends Context.Service<
	Transactions,
	{
		readonly run: typeof runTransaction;
	}
>()("horus/Transactions") {}

export const transactions = Layer.succeed(Transactions, { run: runTransaction });
