import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";
import type {
	ExercisePrRow,
	PrHistoryCutoff,
	PrHistorySet,
	PrSetUpdate,
} from "@/features/personal-records/server/pr-history.functions";

type HistoryQuery = {
	userId: string;
	exerciseIds: string[];
	cutoff: PrHistoryCutoff;
};

const SET_PR_STATUSES_CHUNK_SIZE = 4000;

const exerciseIdsQuerySchema = Schema.Struct({
	userId: Schema.String,
	exerciseIds: Schema.Array(Schema.String),
});

const cutoffQuerySchema = Schema.Struct({
	...exerciseIdsQuerySchema.fields,
	cutoff: Schema.Struct({
		createdAt: Schema.Date,
		workoutId: Schema.String,
	}),
});

const exercisePrRowSchema = Schema.Struct({
	exerciseId: Schema.String,
	hasHistory: Schema.Boolean,
	highestWeight: Schema.Number,
	highestVolume: Schema.Number,
	highestBodyweightReps: Schema.Number,
});

const affectedSetRowSchema = Schema.Struct({
	setId: Schema.String,
	workoutId: Schema.String,
	exerciseId: Schema.String,
	weight: Schema.Number,
	reps: Schema.Number,
	completed: Schema.Boolean,
});

const setStatusUpdateSchema = Schema.Struct({
	setId: Schema.String,
	isWeightPr: Schema.Boolean,
	isVolumePr: Schema.Boolean,
	isBodyweightRepsPr: Schema.Boolean,
});

const updateSetStatusesRequestSchema = Schema.Array(setStatusUpdateSchema);

const updateWorkoutTotalsRequestSchema = Schema.Struct({
	userId: Schema.String,
	workoutIds: Schema.Array(Schema.String),
});

export class PrHistoryDb extends Context.Service<
	PrHistoryDb,
	{
		readonly getPreviousPrs: (
			query: Omit<HistoryQuery, "cutoff"> & { cutoff?: PrHistoryCutoff },
		) => Effect.Effect<ExercisePrRow[], DatabaseError>;
		readonly getAffectedSets: (query: HistoryQuery) => Effect.Effect<PrHistorySet[], DatabaseError>;
		readonly updateSetStatuses: (statuses: PrSetUpdate[]) => Effect.Effect<void, DatabaseError>;
		readonly updateWorkoutTotals: (query: {
			userId: string;
			workoutIds: string[];
		}) => Effect.Effect<void, DatabaseError>;
	}
>()("horus/PrHistoryDb") {}

export const prHistoryDb = Layer.effect(
	PrHistoryDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const getPreviousPrs = SqlSchema.findAll({
			Request: exerciseIdsQuerySchema,
			Result: exercisePrRowSchema,
			execute: (query) => sql`
				SELECT
					w_exercises.exercise_id AS "exerciseId",
					count(*) FILTER (WHERE w_sets.completed) > 0 AS "hasHistory",
					coalesce(
						max(w_sets.weight) FILTER (WHERE w_sets.completed AND w_sets.weight > 0),
						0
					)::double precision AS "highestWeight",
					coalesce(
						max(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.completed AND w_sets.weight > 0),
						0
					)::double precision AS "highestVolume",
					coalesce(
						max(w_sets.reps) FILTER (WHERE w_sets.completed AND w_sets.weight = 0),
						0
					)::double precision AS "highestBodyweightReps"
				FROM workout_sets AS w_sets
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.id = w_sets.workout_exercise_id
				INNER JOIN workouts ON workouts.id = w_exercises.workout_id
				WHERE workouts.user_id = ${query.userId}
					AND w_exercises.exercise_id = ANY(${query.exerciseIds}::uuid[])
				GROUP BY w_exercises.exercise_id
			`,
		});

		const getPreviousPrsBeforeCutoff = SqlSchema.findAll({
			Request: cutoffQuerySchema,
			Result: exercisePrRowSchema,
			execute: (query) => sql`
				SELECT
					w_exercises.exercise_id AS "exerciseId",
					count(*) FILTER (WHERE w_sets.completed) > 0 AS "hasHistory",
					coalesce(
						max(w_sets.weight) FILTER (WHERE w_sets.completed AND w_sets.weight > 0),
						0
					)::double precision AS "highestWeight",
					coalesce(
						max(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.completed AND w_sets.weight > 0),
						0
					)::double precision AS "highestVolume",
					coalesce(
						max(w_sets.reps) FILTER (WHERE w_sets.completed AND w_sets.weight = 0),
						0
					)::double precision AS "highestBodyweightReps"
				FROM workout_sets AS w_sets
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.id = w_sets.workout_exercise_id
				INNER JOIN workouts ON workouts.id = w_exercises.workout_id
				WHERE workouts.user_id = ${query.userId}
					AND w_exercises.exercise_id = ANY(${query.exerciseIds}::uuid[])
					AND (
						workouts.created_at < ${query.cutoff.createdAt}
						OR (
							workouts.created_at = ${query.cutoff.createdAt}
							AND workouts.id < ${query.cutoff.workoutId}::uuid
						)
					)
				GROUP BY w_exercises.exercise_id
			`,
		});

		const getAffectedSets = SqlSchema.findAll({
			Request: cutoffQuerySchema,
			Result: affectedSetRowSchema,
			execute: (query) => sql`
				SELECT
					w_sets.id AS "setId",
					workouts.id AS "workoutId",
					w_exercises.exercise_id AS "exerciseId",
					w_sets.weight::double precision AS weight,
					w_sets.reps::double precision AS reps,
					w_sets.completed
				FROM workout_sets AS w_sets
				INNER JOIN workout_exercises AS w_exercises
					ON w_exercises.id = w_sets.workout_exercise_id
				INNER JOIN workouts ON workouts.id = w_exercises.workout_id
				WHERE workouts.user_id = ${query.userId}
					AND w_exercises.exercise_id = ANY(${query.exerciseIds}::uuid[])
					AND (
						workouts.created_at > ${query.cutoff.createdAt}
						OR (
							workouts.created_at = ${query.cutoff.createdAt}
							AND workouts.id >= ${query.cutoff.workoutId}::uuid
						)
					)
				ORDER BY
					workouts.created_at ASC,
					workouts.id ASC,
					w_exercises.position ASC,
					w_sets.position ASC
			`,
		});

		const updateSetStatuses = SqlSchema.void({
			Request: updateSetStatusesRequestSchema,
			execute: (statuses) =>
				sql`
					UPDATE workout_sets AS w_sets
					SET
						is_weight_pr = batch.is_weight_pr,
						is_volume_pr = batch.is_volume_pr,
						is_bodyweight_reps_pr = batch.is_bodyweight_reps_pr
					FROM (
						SELECT *
						FROM unnest(
							${statuses.map((status) => status.setId)}::uuid[],
							${statuses.map((status) => status.isWeightPr)}::boolean[],
							${statuses.map((status) => status.isVolumePr)}::boolean[],
							${statuses.map((status) => status.isBodyweightRepsPr)}::boolean[]
						) AS batch(set_id, is_weight_pr, is_volume_pr, is_bodyweight_reps_pr)
					) AS batch
					WHERE w_sets.id = batch.set_id
				`,
		});

		const updateWorkoutTotals = SqlSchema.void({
			Request: updateWorkoutTotalsRequestSchema,
			execute: ({ userId, workoutIds }) => sql`
				UPDATE workouts AS workouts_to_update
				SET total_pr_sets = (
					SELECT count(*)::integer
					FROM workout_exercises AS w_exercises
					INNER JOIN workout_sets AS w_sets
						ON w_sets.workout_exercise_id = w_exercises.id
					WHERE w_exercises.workout_id = workouts_to_update.id
						AND (
							w_sets.is_weight_pr
							OR w_sets.is_volume_pr
						OR w_sets.is_bodyweight_reps_pr
						)
				)
				WHERE workouts_to_update.user_id = ${userId}
					AND workouts_to_update.id = ANY(${workoutIds}::uuid[])
			`,
		});

		return {
			getPreviousPrs: (query) => {
				if (query.exerciseIds.length === 0) {
					return Effect.succeed([]);
				}

				if (query.cutoff) {
					return withDatabaseError(getPreviousPrsBeforeCutoff({ ...query, cutoff: query.cutoff }));
				}

				return withDatabaseError(getPreviousPrs(query));
			},
			getAffectedSets: (query) => {
				if (query.exerciseIds.length === 0) {
					return Effect.succeed([]);
				}

				return withDatabaseError(getAffectedSets(query));
			},
			updateSetStatuses: (statuses) =>
				withDatabaseError(
					Effect.forEach(
						Array.from(
							{ length: Math.ceil(statuses.length / SET_PR_STATUSES_CHUNK_SIZE) },
							(_, index) =>
								statuses.slice(
									index * SET_PR_STATUSES_CHUNK_SIZE,
									(index + 1) * SET_PR_STATUSES_CHUNK_SIZE,
								),
						),
						(chunk) => updateSetStatuses(chunk),
						{ concurrency: "unbounded", discard: true },
					),
				),
			updateWorkoutTotals: ({ userId, workoutIds }) => {
				if (workoutIds.length === 0) {
					return Effect.void;
				}

				return withDatabaseError(updateWorkoutTotals({ userId, workoutIds }));
			},
		} satisfies PrHistoryDb["Service"];
	}),
);
