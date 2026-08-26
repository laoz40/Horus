import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutExercises, workouts, workoutSets } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

export type YearInTrainingQuery = {
	userId: string;
	year: number;
};

export function getYearInTrainingRows({ userId, year }: YearInTrainingQuery) {
	const start = new Date(`${year}-01-01T00:00:00.000Z`);
	const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
	const dayKey = sql<string>`to_char(${workouts.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;

	return tryPromise({
		try: () =>
			db
				.select({
					dayKey,
					setCount: sql<number>`count(${workoutSets.id})::integer`,
				})
				.from(workouts)
				.innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
				.innerJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
				.where(
					and(
						eq(workouts.userId, userId),
						eq(workoutSets.completed, true),
						gte(workouts.createdAt, start),
						lt(workouts.createdAt, end),
					),
				)
				.groupBy(dayKey)
				.orderBy(dayKey),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
