import "server-only";

import { getYearInTraining } from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";

export type YearInTrainingQuery = {
	userId: string;
	year: number;
};

export function getYearInTrainingRows({ userId, year }: YearInTrainingQuery) {
	const start = new Date(`${year}-01-01T00:00:00.000Z`);
	const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

	return tryPromise({
		try: async () => {
			const rows = await prisma.$queryRawTyped(getYearInTraining(userId, start, end));

			return rows.flatMap((row) => {
				if (row.day_key === null || row.set_count === null || row.set_count <= 0) {
					return [];
				}

				return [{ dayKey: row.day_key, setCount: row.set_count }];
			});
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
