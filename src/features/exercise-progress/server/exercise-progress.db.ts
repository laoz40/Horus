import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";
import { exercisePersonalRecordCtes } from "@/lib/db/exercise-personal-records";

const exerciseQuerySchema = Schema.Struct({
	userId: Schema.String,
	normalizedExerciseName: Schema.String,
});

const weeklyWeightProgressionQuerySchema = Schema.Struct({
	...exerciseQuerySchema.fields,
	sinceCreatedAt: Schema.Date,
	minReps: Schema.Finite,
});

export interface RecentSetRow {
	id: string;
	weight: number;
	reps: number;
	completedAtMs: number;
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}

export interface WeeklyWeightProgressionRow {
	weekStartMs: number;
	maxWeight: number;
}

export class ProgressDb extends Context.Service<
	ProgressDb,
	{
		readonly getExerciseWeeklyWeightProgression: (query: {
			userId: string;
			normalizedExerciseName: string;
			sinceCreatedAt: Date;
			minReps: number;
		}) => Effect.Effect<WeeklyWeightProgressionRow[], DatabaseError>;
		readonly getRecentSets: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<RecentSetRow[], DatabaseError>;
	}
>()("horus/ProgressDb") {}

export const progressDb = Layer.effect(
	ProgressDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const getExerciseWeeklyWeightProgression = SqlSchema.findAll({
			Request: weeklyWeightProgressionQuerySchema,
			Result: Schema.Struct({
				week_start: Schema.NullOr(Schema.Date),
				max_weight: Schema.NullOr(Schema.Finite),
			}),
			execute: ({ userId, normalizedExerciseName, sinceCreatedAt, minReps }) => sql`
				SELECT
					date_trunc('week', workouts.created_at)::timestamptz AS week_start,
					max(w_sets.weight)::double precision AS max_weight
				FROM workout_sets AS w_sets
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.id = w_sets.workout_exercise_id
				INNER JOIN workouts ON workouts.id = w_exercises.workout_id
				INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
				WHERE workouts.user_id = ${userId}
					AND exercises.user_id = ${userId}
					AND exercises.normalized_name = ${normalizedExerciseName}
					AND w_sets.completed = true
					AND w_sets.weight > 0
					AND w_sets.reps >= ${minReps}
					AND workouts.created_at >= ${sinceCreatedAt}
				GROUP BY 1
				ORDER BY 1
			`,
		});

		const getRecentSets = SqlSchema.findAll({
			Request: exerciseQuerySchema,
			Result: Schema.Struct({
				id: Schema.String,
				weight: Schema.Finite,
				reps: Schema.Finite,
				completed_at_ms: Schema.NullOr(Schema.Finite),
				is_weight_pr: Schema.NullOr(Schema.Boolean),
				is_volume_pr: Schema.NullOr(Schema.Boolean),
				is_bodyweight_reps_pr: Schema.NullOr(Schema.Boolean),
			}),
			execute: (query) => sql`
				WITH ${exercisePersonalRecordCtes(sql, query)},
				recent_sets AS (
					SELECT *
					FROM matching_completed_sets
					ORDER BY completed_at_ms DESC, workout_id DESC, exercise_position DESC, set_position DESC
					LIMIT 6
				)
				SELECT
					recent_sets.set_id AS id,
					recent_sets.set_weight::double precision AS weight,
					recent_sets.set_reps::double precision AS reps,
					recent_sets.completed_at_ms,
					coalesce(recent_sets.set_id = weight_pr.set_id, false) AS is_weight_pr,
					coalesce(recent_sets.set_id = volume_pr.set_id, false) AS is_volume_pr,
					coalesce(recent_sets.set_id = bodyweight_reps_pr.set_id, false) AS is_bodyweight_reps_pr
				FROM recent_sets
				LEFT JOIN weight_pr ON true
				LEFT JOIN volume_pr ON true
				LEFT JOIN bodyweight_reps_pr ON true
				ORDER BY recent_sets.completed_at_ms DESC, recent_sets.workout_id DESC, recent_sets.exercise_position DESC, recent_sets.set_position DESC
			`,
		});

		return {
			getExerciseWeeklyWeightProgression: (query) =>
				getExerciseWeeklyWeightProgression(query).pipe(
					Effect.map((rows) =>
						rows.map((row) => ({
							weekStartMs: row.week_start?.getTime() ?? 0,
							maxWeight: row.max_weight ?? 0,
						})),
					),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
			getRecentSets: (query) =>
				getRecentSets(query).pipe(
					Effect.map((rows) =>
						rows.map((row) => ({
							id: row.id,
							weight: row.weight,
							reps: row.reps,
							completedAtMs: row.completed_at_ms ?? 0,
							isWeightPr: row.is_weight_pr ?? false,
							isVolumePr: row.is_volume_pr ?? false,
							isBodyweightRepsPr: row.is_bodyweight_reps_pr ?? false,
						})),
					),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
		} satisfies ProgressDb["Service"];
	}),
);
