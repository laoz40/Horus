import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";

const personalRecordsQuerySchema = Schema.Struct({
	userId: Schema.String,
	normalizedExerciseName: Schema.String,
});

const personalRecordSetSchema = Schema.Struct({
	id: Schema.NullOr(Schema.String),
	weight: Schema.NullOr(Schema.Number),
	reps: Schema.NullOr(Schema.Number),
	completedAtMs: Schema.NullOr(Schema.Number),
});

const personalRecordsRowSchema = Schema.Struct({
	hasHistory: Schema.Boolean,
	weightId: Schema.NullOr(Schema.String),
	weightWeight: Schema.NullOr(Schema.Number),
	weightReps: Schema.NullOr(Schema.Number),
	weightCompletedAtMs: Schema.NullOr(Schema.Number),
	volumeId: Schema.NullOr(Schema.String),
	volumeWeight: Schema.NullOr(Schema.Number),
	volumeReps: Schema.NullOr(Schema.Number),
	volumeCompletedAtMs: Schema.NullOr(Schema.Number),
	bodyweightRepsId: Schema.NullOr(Schema.String),
	bodyweightRepsWeight: Schema.NullOr(Schema.Number),
	bodyweightRepsReps: Schema.NullOr(Schema.Number),
	bodyweightRepsCompletedAtMs: Schema.NullOr(Schema.Number),
});

export interface ExercisePersonalRecordsRow {
	hasHistory: boolean;
	weight: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
	volume: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
	bodyweightReps: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
}

function mapPersonalRecordSet(
	set: typeof personalRecordSetSchema.Type,
): ExercisePersonalRecordsRow["weight"] {
	if (set.id === null || set.weight === null || set.reps === null) {
		return null;
	}

	return {
		id: set.id,
		weight: set.weight,
		reps: set.reps,
		completedAtMs: set.completedAtMs ?? 0,
	};
}

export class PersonalRecordsDb extends Context.Service<
	PersonalRecordsDb,
	{
		readonly getExercisePr: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<
			Array<{
				hasHistory: boolean;
				highestWeight: number;
				highestVolume: number;
				highestBodyweightReps: number;
			}>,
			DatabaseError
		>;
		readonly getExercisePersonalRecords: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<ExercisePersonalRecordsRow[], DatabaseError>;
	}
>()("horus/PersonalRecordsDb") {}

export const personalRecordsDb = Layer.effect(
	PersonalRecordsDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const getExercisePr = SqlSchema.findOne({
			Request: personalRecordsQuerySchema,
			Result: Schema.Struct({
				has_history: Schema.NullOr(Schema.Boolean),
				highest_weight: Schema.NullOr(Schema.Number),
				highest_volume: Schema.NullOr(Schema.Number),
				highest_bodyweight_reps: Schema.NullOr(Schema.Number),
			}),
			execute: ({ userId, normalizedExerciseName }) => sql`
				SELECT
					count(*) > 0 AS has_history,
					coalesce(
						max(w_sets.weight) FILTER (WHERE w_sets.weight > 0),
						0
					)::double precision AS highest_weight,
					coalesce(
						max(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.weight > 0),
						0
					)::double precision AS highest_volume,
					coalesce(
						max(w_sets.reps) FILTER (WHERE w_sets.weight = 0),
						0
					)::double precision AS highest_bodyweight_reps
				FROM workout_sets AS w_sets
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.id = w_sets.workout_exercise_id
				INNER JOIN workouts ON workouts.id = w_exercises.workout_id
				INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
				WHERE workouts.user_id = ${userId}
					AND exercises.user_id = ${userId}
					AND exercises.normalized_name = ${normalizedExerciseName}
					AND w_sets.completed = true
			`,
		});

		const getExercisePersonalRecords = SqlSchema.findAll({
			Request: personalRecordsQuerySchema,
			Result: personalRecordsRowSchema,
			execute: ({ userId, normalizedExerciseName }) => sql`
				WITH matching_completed_sets AS (
					SELECT
						w_sets.id AS set_id,
						w_sets.weight AS set_weight,
						w_sets.reps AS set_reps,
						(extract(epoch FROM workouts.created_at) * 1000)::double precision AS completed_at_ms,
						workouts.id AS workout_id,
						w_exercises.position AS exercise_position,
						w_sets.position AS set_position
					FROM workout_sets AS w_sets
					INNER JOIN workout_exercises AS w_exercises
						ON w_exercises.id = w_sets.workout_exercise_id
					INNER JOIN workouts ON workouts.id = w_exercises.workout_id
					INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
					WHERE workouts.user_id = ${userId}
						AND exercises.user_id = ${userId}
						AND exercises.normalized_name = ${normalizedExerciseName}
						AND w_sets.completed = true
				),
				weight_pr AS (
					SELECT set_id, set_weight, set_reps, completed_at_ms
					FROM matching_completed_sets
					WHERE set_weight > 0
					ORDER BY set_weight DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
					LIMIT 1
				),
				volume_pr AS (
					SELECT set_id, set_weight, set_reps, completed_at_ms
					FROM matching_completed_sets
					WHERE set_weight * set_reps > 0
					ORDER BY set_weight * set_reps DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
					LIMIT 1
				),
				bodyweight_reps_pr AS (
					SELECT set_id, set_weight, set_reps, completed_at_ms
					FROM matching_completed_sets
					WHERE set_weight = 0 AND set_reps > 0
					ORDER BY set_reps DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
					LIMIT 1
				)
				SELECT
					(SELECT count(*) > 0 FROM matching_completed_sets) AS "hasHistory",
					weight_pr.set_id AS "weightId",
					weight_pr.set_weight::double precision AS "weightWeight",
					weight_pr.set_reps::double precision AS "weightReps",
					weight_pr.completed_at_ms AS "weightCompletedAtMs",
					volume_pr.set_id AS "volumeId",
					volume_pr.set_weight::double precision AS "volumeWeight",
					volume_pr.set_reps::double precision AS "volumeReps",
					volume_pr.completed_at_ms AS "volumeCompletedAtMs",
					bodyweight_reps_pr.set_id AS "bodyweightRepsId",
					bodyweight_reps_pr.set_weight::double precision AS "bodyweightRepsWeight",
					bodyweight_reps_pr.set_reps::double precision AS "bodyweightRepsReps",
					bodyweight_reps_pr.completed_at_ms AS "bodyweightRepsCompletedAtMs"
				FROM (SELECT 1) AS _one
				LEFT JOIN weight_pr ON true
				LEFT JOIN volume_pr ON true
				LEFT JOIN bodyweight_reps_pr ON true
			`,
		});

		return {
			getExercisePr: (query) =>
				getExercisePr(query).pipe(
					Effect.map((row) => [
						{
							hasHistory: row.has_history ?? false,
							highestWeight: row.highest_weight ?? 0,
							highestVolume: row.highest_volume ?? 0,
							highestBodyweightReps: row.highest_bodyweight_reps ?? 0,
						},
					]),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
			getExercisePersonalRecords: (query) =>
				getExercisePersonalRecords(query).pipe(
					Effect.map((rows) =>
						rows.map((row) => ({
							hasHistory: row.hasHistory,
							weight: mapPersonalRecordSet({
								id: row.weightId,
								weight: row.weightWeight,
								reps: row.weightReps,
								completedAtMs: row.weightCompletedAtMs,
							}),
							volume: mapPersonalRecordSet({
								id: row.volumeId,
								weight: row.volumeWeight,
								reps: row.volumeReps,
								completedAtMs: row.volumeCompletedAtMs,
							}),
							bodyweightReps: mapPersonalRecordSet({
								id: row.bodyweightRepsId,
								weight: row.bodyweightRepsWeight,
								reps: row.bodyweightRepsReps,
								completedAtMs: row.bodyweightRepsCompletedAtMs,
							}),
						})),
					),
					Effect.mapError((cause) => new DatabaseError({ cause })),
				),
		} satisfies PersonalRecordsDb["Service"];
	}),
);
