import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import type { PrHistoryCutoff } from "@/features/personal-records/server/pr-history.functions";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";

type NamedMuscleGroup = { name: string; normalizedName: string };

const ownedExerciseSchema = Schema.Struct({ userId: Schema.String, exerciseId: Schema.String });

const exerciseRowSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	normalizedName: Schema.String,
	muscleGroups: Schema.mutable(Schema.Array(Schema.String)),
});

const libraryRowSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	muscleGroups: Schema.mutable(Schema.Array(Schema.String)),
	workoutCount: Schema.Int,
});

export type UserExerciseLibraryRow = typeof libraryRowSchema.Type;

export class ExerciseDb extends Context.Service<
	ExerciseDb,
	{
		readonly insertUserExercise: (input: {
			userId: string;
			name: string;
			normalizedName: string;
		}) => Effect.Effect<string, DatabaseError>;
		readonly updateUserExercise: (input: {
			userId: string;
			exerciseId: string;
			name: string;
			normalizedName: string;
		}) => Effect.Effect<string | null, DatabaseError>;
		readonly getMuscleGroupNames: (exerciseId: string) => Effect.Effect<string[], DatabaseError>;
		readonly deleteMuscleGroups: (exerciseId: string) => Effect.Effect<void, DatabaseError>;
		readonly addMuscleGroups: (input: {
			exerciseId: string;
			groups: NamedMuscleGroup[];
		}) => Effect.Effect<void, DatabaseError>;
		readonly findMergeCutoff: (input: {
			userId: string;
			sourceId: string;
			targetId: string;
		}) => Effect.Effect<PrHistoryCutoff | null, DatabaseError>;
		readonly unionMuscleGroups: (input: {
			sourceId: string;
			targetId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly moveWorkoutExercises: (input: {
			sourceId: string;
			targetId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly findUserExerciseIdByNormalizedName: (query: {
			userId: string;
			normalizedName: string;
		}) => Effect.Effect<string | null, DatabaseError>;
		readonly getUserExercise: (query: {
			userId: string;
			exerciseId: string;
		}) => Effect.Effect<UserExerciseLibraryRow | null, DatabaseError>;
		readonly deleteUserExercise: (query: {
			userId: string;
			exerciseId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly listUserExercises: (
			userId: string,
		) => Effect.Effect<UserExerciseLibraryRow[], DatabaseError>;
		readonly listByCategory: (query: {
			userId: string;
			normalizedMuscleNames: string[];
		}) => Effect.Effect<
			Array<{ id: string; name: string; normalizedName: string; muscleGroups: string[] }>,
			DatabaseError
		>;
		readonly searchExercises: (query: {
			userId: string;
			normalizedQuery: string;
		}) => Effect.Effect<
			Array<{ id: string; name: string; normalizedName: string; muscleGroups: string[] }>,
			DatabaseError
		>;
	}
>()("horus/ExerciseDb") {}

export const exerciseDb = Layer.effect(
	ExerciseDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const db: ExerciseDb["Service"] = {
			insertUserExercise: (input) => {
				const insertUserExerciseQuery = SqlSchema.findOne({
					Request: Schema.Struct({
						userId: Schema.String,
						name: Schema.String,
						normalizedName: Schema.String,
					}),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (query) => sql`
						INSERT INTO exercises (user_id, name, normalized_name)
						VALUES (${query.userId}, ${query.name}, ${query.normalizedName}) RETURNING id
					`,
				});

				return insertUserExerciseQuery(input).pipe(
					Effect.map((row) => row.id),
					withDatabaseError,
				);
			},
			updateUserExercise: (input) => {
				const updateUserExerciseQuery = SqlSchema.findOneOption({
					Request: Schema.Struct({
						...ownedExerciseSchema.fields,
						name: Schema.String,
						normalizedName: Schema.String,
					}),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (query) => sql`
						UPDATE exercises SET name = ${query.name}, normalized_name = ${query.normalizedName}
						WHERE id = ${query.exerciseId}::uuid AND user_id = ${query.userId} RETURNING id
					`,
				});

				return updateUserExerciseQuery(input).pipe(
					Effect.map((row) => Option.getOrNull(row)?.id ?? null),
					withDatabaseError,
				);
			},
			getMuscleGroupNames: (exerciseId) => {
				const getMuscleGroupNamesQuery = SqlSchema.findAll({
					Request: Schema.String,
					Result: Schema.Struct({ normalizedName: Schema.String }),
					execute: (id) => sql`
						SELECT mg.normalized_name AS "normalizedName" FROM exercise_muscle_groups emg
						JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
						WHERE emg.exercise_id = ${id}::uuid
					`,
				});

				return getMuscleGroupNamesQuery(exerciseId).pipe(
					Effect.map((groups) => groups.map((group) => group.normalizedName)),
					withDatabaseError,
				);
			},
			deleteMuscleGroups: (exerciseId) => {
				const deleteMuscleGroupsQuery = SqlSchema.void({
					Request: Schema.String,
					execute: (id) => sql`DELETE FROM exercise_muscle_groups WHERE exercise_id = ${id}::uuid`,
				});

				return deleteMuscleGroupsQuery(exerciseId).pipe(withDatabaseError);
			},
			addMuscleGroups: ({ exerciseId, groups }) => {
				const addMuscleGroupsQuery = SqlSchema.void({
					Request: Schema.Struct({
						exerciseId: Schema.String,
						groups: Schema.Array(
							Schema.Struct({ name: Schema.String, normalizedName: Schema.String }),
						),
					}),
					execute: (input) => sql`
						WITH upserted_groups AS (
							INSERT INTO muscle_groups (name, normalized_name)
							SELECT * FROM unnest(
								${input.groups.map((group) => group.name)}::text[],
								${input.groups.map((group) => group.normalizedName)}::text[]
							) WHERE true
							ON CONFLICT (normalized_name) DO UPDATE
								SET normalized_name = EXCLUDED.normalized_name RETURNING id
						)
						INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
						SELECT ${input.exerciseId}::uuid, id FROM upserted_groups WHERE true ON CONFLICT DO NOTHING
					`,
				});

				return (
					groups.length === 0 ? Effect.void : addMuscleGroupsQuery({ exerciseId, groups })
				).pipe(withDatabaseError);
			},
			findMergeCutoff: (input) => {
				const findMergeCutoffQuery = SqlSchema.findOneOption({
					Request: Schema.Struct({
						userId: Schema.String,
						sourceId: Schema.String,
						targetId: Schema.String,
					}),
					Result: Schema.Struct({ workoutId: Schema.String, createdAt: Schema.Date }),
					execute: (query) => sql`
						SELECT w.id AS "workoutId", w.created_at AS "createdAt" FROM workouts w
						WHERE w.user_id = ${query.userId} AND EXISTS (
							SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id
							AND we.exercise_id IN (${query.sourceId}::uuid, ${query.targetId}::uuid)
						) ORDER BY w.created_at ASC, w.id ASC LIMIT 1
					`,
				});

				return findMergeCutoffQuery(input).pipe(Effect.map(Option.getOrNull), withDatabaseError);
			},
			unionMuscleGroups: ({ sourceId, targetId }) => {
				const unionMuscleGroupsQuery = SqlSchema.void({
					Request: Schema.Struct({ sourceId: Schema.String, targetId: Schema.String }),
					execute: (input) => sql`
						INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
						SELECT ${input.targetId}::uuid, muscle_group_id FROM exercise_muscle_groups
						WHERE exercise_id = ${input.sourceId}::uuid ON CONFLICT DO NOTHING
					`,
				});

				return unionMuscleGroupsQuery({ sourceId, targetId }).pipe(withDatabaseError);
			},
			moveWorkoutExercises: ({ sourceId, targetId }) => {
				const moveWorkoutExercisesQuery = SqlSchema.void({
					Request: Schema.Struct({ sourceId: Schema.String, targetId: Schema.String }),
					execute: (input) => sql`
						UPDATE workout_exercises SET exercise_id = ${input.targetId}::uuid
						WHERE exercise_id = ${input.sourceId}::uuid
					`,
				});

				return moveWorkoutExercisesQuery({ sourceId, targetId }).pipe(withDatabaseError);
			},
			findUserExerciseIdByNormalizedName: (query) => {
				const findExerciseId = SqlSchema.findOneOption({
					Request: Schema.Struct({ userId: Schema.String, normalizedName: Schema.String }),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (input) => sql`
					SELECT id FROM exercises WHERE user_id = ${input.userId}
					AND normalized_name = ${input.normalizedName} LIMIT 1
				`,
				});

				return findExerciseId(query).pipe(
					Effect.map((row) => Option.getOrNull(row)?.id ?? null),
					withDatabaseError,
				);
			},
			getUserExercise: (query) => {
				const findExercise = SqlSchema.findOneOption({
					Request: ownedExerciseSchema,
					Result: libraryRowSchema,
					execute: (input) => sql`
					SELECT e.id, e.name, coalesce(array_agg(mg.name ORDER BY mg.name)
						FILTER (WHERE mg.name IS NOT NULL), array[]::text[]) AS "muscleGroups",
						(SELECT count(*)::int FROM workout_exercises WHERE exercise_id = e.id) AS "workoutCount"
					FROM exercises e LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
					LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
					WHERE e.user_id = ${input.userId} AND e.id = ${input.exerciseId}::uuid GROUP BY e.id LIMIT 1
				`,
				});

				return findExercise(query).pipe(Effect.map(Option.getOrNull), withDatabaseError);
			},
			deleteUserExercise: (query) => {
				const deleteExercise = SqlSchema.void({
					Request: ownedExerciseSchema,
					execute: (input) =>
						sql`DELETE FROM exercises WHERE user_id = ${input.userId} AND id = ${input.exerciseId}::uuid`,
				});

				return deleteExercise(query).pipe(withDatabaseError);
			},
			listUserExercises: (userId) => {
				const findExercises = SqlSchema.findAll({
					Request: Schema.String,
					Result: libraryRowSchema,
					execute: (ownerId) => sql`
					SELECT e.id, e.name, coalesce(array_agg(mg.name ORDER BY mg.name)
						FILTER (WHERE mg.name IS NOT NULL), array[]::text[]) AS "muscleGroups",
						(SELECT count(*)::int FROM workout_exercises WHERE exercise_id = e.id) AS "workoutCount"
					FROM exercises e LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
					LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
					WHERE e.user_id = ${ownerId} GROUP BY e.id ORDER BY e.name ASC
				`,
				});

				return findExercises(userId).pipe(withDatabaseError);
			},
			listByCategory: (query) => {
				const findExercisesByCategory = SqlSchema.findAll({
					Request: Schema.Struct({
						userId: Schema.String,
						normalizedMuscleNames: Schema.mutable(Schema.Array(Schema.String)),
					}),
					Result: exerciseRowSchema,
					execute: (input) => sql`
					SELECT e.id, e.name, e.normalized_name AS "normalizedName",
						array_agg(mg.name ORDER BY mg.name) AS "muscleGroups"
					FROM exercises e JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
					JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
					WHERE e.user_id = ${input.userId} AND EXISTS (
						SELECT 1 FROM exercise_muscle_groups filter_emg JOIN muscle_groups filter_mg ON filter_mg.id = filter_emg.muscle_group_id
						WHERE filter_emg.exercise_id = e.id AND filter_mg.normalized_name = ANY(${input.normalizedMuscleNames}::text[])
					) GROUP BY e.id ORDER BY e.name ASC
				`,
				});

				return findExercisesByCategory(query).pipe(withDatabaseError);
			},
			searchExercises: (query) => {
				const searchExerciseRows = SqlSchema.findAll({
					Request: Schema.Struct({ userId: Schema.String, normalizedQuery: Schema.String }),
					Result: exerciseRowSchema,
					execute: (input) => sql`
					SELECT e.id, e.name, e.normalized_name AS "normalizedName",
						coalesce(array_agg(mg.name ORDER BY mg.name) FILTER (WHERE mg.name IS NOT NULL), array[]::text[]) AS "muscleGroups"
					FROM exercises e LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
					LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
					WHERE e.user_id = ${input.userId} AND position(${input.normalizedQuery} in e.normalized_name) > 0
					GROUP BY e.id ORDER BY e.name ASC LIMIT 10
				`,
				});

				return searchExerciseRows(query).pipe(withDatabaseError);
			},
		};

		return db;
	}),
);
