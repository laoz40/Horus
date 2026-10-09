import "server-only";

import { Context, Effect, Layer } from "effect";
import { getOldestWorkoutCreatedAt, getYearInTraining } from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DatabaseError } from "@/lib/db/database";

export class DashboardDb extends Context.Service<
	DashboardDb,
	{
		readonly getOldestWorkoutDate: (userId: string) => Effect.Effect<Date | null, DatabaseError>;
		readonly getDailySetCounts: (query: {
			userId: string;
			start: Date;
			end: Date;
		}) => Effect.Effect<Array<{ dayKey: string; setCount: number }>, DatabaseError>;
	}
>()("horus/DashboardDb") {}

export const dashboardDb = Layer.succeed(DashboardDb, {
	getOldestWorkoutDate: (userId) =>
		Effect.gen(function* () {
			const [row] = yield* Effect.tryPromise({
				try: () => prisma.$queryRawTyped(getOldestWorkoutCreatedAt(userId)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return row?.oldest_created_at ?? null;
		}),
	getDailySetCounts: ({ userId, start, end }) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () => prisma.$queryRawTyped(getYearInTraining(userId, start, end)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return rows.flatMap((row) => {
				if (row.day_key === null || row.set_count === null || row.set_count <= 0) {
					return [];
				}

				return [{ dayKey: row.day_key, setCount: row.set_count }];
			});
		}),
});
