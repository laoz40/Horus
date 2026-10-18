import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";

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

const workoutQuerySchema = Schema.Struct({ workoutId: Schema.String, userId: Schema.String });

const workoutRowSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	createdAt: Schema.Date,
});

const exerciseIdSchema = Schema.Struct({ exerciseId: Schema.String });

const deletedCountSchema = Schema.Struct({ deletedCount: Schema.Int });

export type ListWorkoutsQuery = typeof listWorkoutsQuerySchema.Type;

export type WorkoutHistoryRow = typeof workoutHistoryRowSchema.Type;

export class WorkoutHistoryDb extends Context.Service<
	WorkoutHistoryDb,
	{
		readonly listWorkouts: (
			query: ListWorkoutsQuery,
		) => Effect.Effect<WorkoutHistoryRow[], DatabaseError>;
		readonly getForUpdate: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<typeof workoutRowSchema.Type | null, DatabaseError>;
		readonly getExerciseIds: (workoutId: string) => Effect.Effect<string[], DatabaseError>;
		readonly delete: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly deleteAllWorkouts: (
			userId: string,
		) => Effect.Effect<{ deletedCount: number }, DatabaseError>;
	}
>()("horus/WorkoutHistoryDb") {}

export const workoutHistoryDb = Layer.effect(
	WorkoutHistoryDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			listWorkouts: (query) => {
				const listWorkouts = SqlSchema.findAll({
					Request: listWorkoutsQuerySchema,
					Result: workoutHistoryRowSchema,
					execute: (queryInput) => sql`
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
				WHERE workouts.user_id = ${queryInput.userId}
				GROUP BY workouts.id
				ORDER BY workouts.created_at DESC
				LIMIT ${queryInput.limit + 1}
				OFFSET ${queryInput.offset}
			`,
				});

				return listWorkouts(query).pipe(withDatabaseError);
			},
			getForUpdate: (query) => {
				const getForUpdate = SqlSchema.findOneOption({
					Request: workoutQuerySchema,
					Result: workoutRowSchema,
					execute: ({ workoutId, userId }) => sql`
				SELECT id, name, created_at AS "createdAt" FROM workouts
				WHERE id = ${workoutId}::uuid AND user_id = ${userId}
				LIMIT 1 FOR UPDATE
			`,
				});

				return getForUpdate(query).pipe(Effect.map(Option.getOrNull), withDatabaseError);
			},
			getExerciseIds: (workoutId) => {
				const getExerciseIds = SqlSchema.findAll({
					Request: Schema.String,
					Result: exerciseIdSchema,
					execute: (requestedWorkoutId) => sql`
				SELECT DISTINCT exercise_id AS "exerciseId" FROM workout_exercises
				WHERE workout_id = ${requestedWorkoutId}::uuid
			`,
				});

				return getExerciseIds(workoutId).pipe(
					Effect.map((rows) => rows.map((row) => row.exerciseId)),
					withDatabaseError,
				);
			},
			delete: ({ workoutId, userId }) =>
				sql`DELETE FROM workouts WHERE id = ${workoutId}::uuid AND user_id = ${userId}`.pipe(
					Effect.asVoid,
					withDatabaseError,
				),
			deleteAllWorkouts: (userId) => {
				const deleteAllWorkouts = SqlSchema.findOne({
					Request: Schema.String,
					Result: deletedCountSchema,
					execute: (requestedUserId) => sql`
				WITH deleted AS (DELETE FROM workouts WHERE user_id = ${requestedUserId} RETURNING id)
				SELECT count(*)::int AS "deletedCount" FROM deleted
			`,
				});

				return deleteAllWorkouts(userId).pipe(withDatabaseError);
			},
		} satisfies WorkoutHistoryDb["Service"];
	}),
);
