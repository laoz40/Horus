import "server-only";

import { Effect } from "effect";
import { DashboardDb } from "@/server/dashboard/dashboard.db";

type YearInTrainingQuery = {
	userId: string;
	year: number;
};

export const getYearInTraining = ({ userId, year }: YearInTrainingQuery) =>
	Effect.gen(function* () {
		const db = yield* DashboardDb;
		const start = new Date(`${year}-01-01T00:00:00.000Z`);
		const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

		return yield* db.getDailySetCounts({ userId, start, end });
	});

export const getTrainingYearRange = (userId: string) =>
	Effect.gen(function* () {
		const db = yield* DashboardDb;
		const currentYear = new Date().getUTCFullYear();
		const oldestWorkoutDate = yield* db.getOldestWorkoutDate(userId);
		const oldestYear = oldestWorkoutDate?.getUTCFullYear() ?? currentYear;

		return {
			firstYear: Math.min(oldestYear, currentYear),
			lastYear: currentYear,
		};
	});
