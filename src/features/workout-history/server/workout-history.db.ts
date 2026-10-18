import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";
import { sqlClient } from "@/lib/db/sql";

const listWorkoutsQuerySchema = Schema.Struct({
	userId: Schema.String,
	limit: Schema.Int,
	offset: Schema.Int,
});

const workoutHistoryRowSchema = Schema.Struct({
	id: Schema.String,
	createdAt: Schema.Date,
	name: Schema.String,
	durationSeconds: Schema.NullOr(Schema.Int),
	totalPrSets: Schema.Int,
	exerciseCount: Schema.Int,
	totalVolume: Schema.Number,
	muscleGroups: Schema.mutable(Schema.Array(Schema.String)),
});

export type ListWorkoutsQuery = typeof listWorkoutsQuerySchema.Type;

export type WorkoutHistoryRow = typeof workoutHistoryRowSchema.Type;

export class WorkoutHistoryDb extends Context.Service<
	WorkoutHistoryDb,
	{
		readonly listWorkouts: (
			query: ListWorkoutsQuery,
		) => Effect.Effect<WorkoutHistoryRow[], DatabaseError>;
	}
>()("horus/WorkoutHistoryDb") {}

export const workoutHistoryDb = Layer.effect(
	WorkoutHistoryDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const findAll = SqlSchema.findAll({
			Request: listWorkoutsQuerySchema,
			Result: workoutHistoryRowSchema,
			execute: (query) => sql`
				SELECT
					workouts.id,
					workouts.created_at AS "createdAt",
					workouts.name,
					workouts.duration_seconds AS "durationSeconds",
					workouts.total_pr_sets AS "totalPrSets",
					count(DISTINCT w_exercises.id)::int AS "exerciseCount",
					coalesce(
						sum(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.completed = true),
						0
					)::double precision AS "totalVolume",
					(
						SELECT coalesce(
							array_agg(DISTINCT muscle_groups.name ORDER BY muscle_groups.name),
							array[]::text[]
						)
						FROM workout_exercises AS w_exercises_muscles
						JOIN exercises ON exercises.id = w_exercises_muscles.exercise_id
						JOIN exercise_muscle_groups AS e_muscle_groups
							ON e_muscle_groups.exercise_id = exercises.id
						JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
						WHERE w_exercises_muscles.workout_id = workouts.id
					) AS "muscleGroups"
				FROM workouts
				LEFT JOIN workout_exercises AS w_exercises
					ON w_exercises.workout_id = workouts.id
				LEFT JOIN workout_sets AS w_sets
					ON w_sets.workout_exercise_id = w_exercises.id
				WHERE workouts.user_id = ${query.userId}
				GROUP BY workouts.id
				ORDER BY workouts.created_at DESC
				LIMIT ${query.limit + 1}
				OFFSET ${query.offset}
			`,
		});

		return {
			listWorkouts: (query) =>
				findAll(query).pipe(Effect.mapError((cause) => new DatabaseError({ cause }))),
		} satisfies WorkoutHistoryDb["Service"];
	}),
).pipe(Layer.provide(sqlClient));
