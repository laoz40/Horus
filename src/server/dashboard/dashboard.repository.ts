import "server-only";

import { Effect } from "effect";
import { getOldestWorkoutCreatedAt, getYearInTraining } from "@/generated/prisma/sql";
import { Database, DatabaseError } from "@/lib/db/database";

export type YearInTrainingQuery = {
	userId: string;
	year: number;
};

export const getTrainingYearRangeRows = (userId: string) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;
		const currentYear = new Date().getUTCFullYear();

		const [row] = yield* Effect.tryPromise({
			try: () => prisma.$queryRawTyped(getOldestWorkoutCreatedAt(userId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		const oldestYear = row?.oldest_created_at?.getUTCFullYear() ?? currentYear;

		return {
			firstYear: Math.min(oldestYear, currentYear),
			lastYear: currentYear,
		};
	});

export const getYearInTrainingRows = ({ userId, year }: YearInTrainingQuery) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;
		const start = new Date(`${year}-01-01T00:00:00.000Z`);
		const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

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
	});
