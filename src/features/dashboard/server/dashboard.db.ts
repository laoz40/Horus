import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";

const dailySetCountsQuerySchema = Schema.Struct({
	userId: Schema.String,
	start: Schema.Date,
	end: Schema.Date,
});

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

export const dashboardDb = Layer.effect(
	DashboardDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const getOldestWorkoutDate = SqlSchema.findOne({
			Request: Schema.String,
			Result: Schema.Struct({ oldest_created_at: Schema.NullOr(Schema.Date) }),
			execute: (userId) => sql`
				SELECT min(workouts.created_at) AS oldest_created_at
				FROM workouts
				WHERE workouts.user_id = ${userId}
			`,
		});

		const getDailySetCounts = SqlSchema.findAll({
			Request: dailySetCountsQuerySchema,
			Result: Schema.Struct({
				day_key: Schema.NullOr(Schema.String),
				set_count: Schema.NullOr(Schema.Int),
			}),
			execute: ({ userId, start, end }) => sql`
				SELECT
					to_char(workouts.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_key,
					count(w_sets.id)::int AS set_count
				FROM workouts
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.workout_id = workouts.id
				INNER JOIN workout_sets AS w_sets
					ON w_sets.workout_exercise_id = w_exercises.id
				WHERE workouts.user_id = ${userId}
					AND w_sets.completed = true
					AND workouts.created_at >= ${start}
					AND workouts.created_at < ${end}
				GROUP BY 1
				ORDER BY 1
			`,
		});

		return {
			getOldestWorkoutDate: (userId) =>
				getOldestWorkoutDate(userId).pipe(
					Effect.map((row) => row.oldest_created_at),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
			getDailySetCounts: (query) =>
				getDailySetCounts(query).pipe(
					Effect.map((rows) =>
						rows.flatMap((row) => {
							if (row.day_key === null || row.set_count === null || row.set_count <= 0) {
								return [];
							}

							return [{ dayKey: row.day_key, setCount: row.set_count }];
						}),
					),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
		} satisfies DashboardDb["Service"];
	}),
);
