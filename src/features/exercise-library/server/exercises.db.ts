import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import type { PrHistoryCutoff } from "@/features/personal-records/server/pr-history.functions";
import { ExerciseNotFoundError } from "@/features/exercise-library/server/library.functions";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";

type NamedMuscleGroup = { name: string; normalizedName: string };

type ExerciseWriteInput = {
	userId: string;
	exercise: { name: string; normalizedName: string; muscleGroups: NamedMuscleGroup[] };
};

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

function mapWriteError(cause: unknown) {
	return cause instanceof DatabaseError || cause instanceof ExerciseNotFoundError
		? cause
		: new DatabaseError({ cause });
}

export class ExerciseDb extends Context.Service<
	ExerciseDb,
	{
		readonly create: (
			input: ExerciseWriteInput,
		) => Effect.Effect<UserExerciseLibraryRow, DatabaseError>;
		readonly update: (
			input: ExerciseWriteInput & { exerciseId: string },
		) => Effect.Effect<UserExerciseLibraryRow, DatabaseError | ExerciseNotFoundError>;
		readonly merge: (input: {
			userId: string;
			sourceId: string;
			targetId: string;
			sourceMuscleGroups: Array<{ name: string; normalizedName: string }> | null;
		}) => Effect.Effect<PrHistoryCutoff | null, DatabaseError | ExerciseNotFoundError>;
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
			create: ({ userId, exercise }) =>
				Effect.gen(function* () {
					const insertExercise = SqlSchema.findOne({
						Request: Schema.Struct({
							userId: Schema.String,
							name: Schema.String,
							normalizedName: Schema.String,
						}),
						Result: Schema.Struct({ id: Schema.String }),
						execute: (input) => sql`
						INSERT INTO exercises (user_id, name, normalized_name)
						VALUES (${input.userId}, ${input.name}, ${input.normalizedName}) RETURNING id
					`,
					});

					const created = yield* insertExercise({ userId, ...exercise });

					yield* addMuscleGroups(sql, created.id, exercise.muscleGroups);
					const row = yield* db.getUserExercise({ userId, exerciseId: created.id });

					if (!row)
						return yield* Effect.fail(
							new DatabaseError({ cause: new Error("Created exercise was not found") }),
						);

					return row;
				}).pipe(withDatabaseError),
			update: ({ userId, exerciseId, exercise }) =>
				Effect.gen(function* () {
					const updateExercise = SqlSchema.findOneOption({
						Request: Schema.Struct({
							...ownedExerciseSchema.fields,
							name: Schema.String,
							normalizedName: Schema.String,
						}),
						Result: Schema.Struct({ id: Schema.String }),
						execute: (input) => sql`
						UPDATE exercises SET name = ${input.name}, normalized_name = ${input.normalizedName}
						WHERE id = ${input.exerciseId}::uuid AND user_id = ${input.userId} RETURNING id
					`,
					});

					const updated = yield* updateExercise({ userId, exerciseId, ...exercise });

					if (Option.isNone(updated)) return yield* Effect.fail(new ExerciseNotFoundError());
					yield* replaceMuscleGroups(sql, exerciseId, exercise.muscleGroups);
					const row = yield* db.getUserExercise({ userId, exerciseId });

					if (!row) return yield* Effect.fail(new ExerciseNotFoundError());

					return row;
				}).pipe(Effect.mapError(mapWriteError)),
			merge: ({ userId, sourceId, targetId, sourceMuscleGroups }) =>
				Effect.gen(function* () {
					if (sourceId === targetId) return yield* Effect.fail(new ExerciseNotFoundError());

					const [source, target] = yield* Effect.all(
						[
							db.getUserExercise({ userId, exerciseId: sourceId }),
							db.getUserExercise({ userId, exerciseId: targetId }),
						],
						{ concurrency: "unbounded" },
					);

					if (!source || !target) return yield* Effect.fail(new ExerciseNotFoundError());

					if (sourceMuscleGroups !== null)
						yield* replaceMuscleGroups(sql, sourceId, sourceMuscleGroups);

					const findCutoff = SqlSchema.findOneOption({
						Request: Schema.Struct({
							userId: Schema.String,
							sourceId: Schema.String,
							targetId: Schema.String,
						}),
						Result: Schema.Struct({ workoutId: Schema.String, createdAt: Schema.Date }),
						execute: (input) => sql`
						SELECT w.id AS "workoutId", w.created_at AS "createdAt" FROM workouts w
						WHERE w.user_id = ${input.userId} AND EXISTS (
							SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id
							AND we.exercise_id IN (${input.sourceId}::uuid, ${input.targetId}::uuid)
						) ORDER BY w.created_at ASC, w.id ASC LIMIT 1
					`,
					});

					const cutoff = yield* findCutoff({ userId, sourceId, targetId });

					yield* sql`
					INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
					SELECT ${targetId}::uuid, muscle_group_id FROM exercise_muscle_groups
					WHERE exercise_id = ${sourceId}::uuid ON CONFLICT DO NOTHING
				`;
					yield* sql`UPDATE workout_exercises SET exercise_id = ${targetId}::uuid WHERE exercise_id = ${sourceId}::uuid`;
					yield* db.deleteUserExercise({ userId, exerciseId: sourceId });

					return Option.getOrNull(cutoff);
				}).pipe(Effect.mapError(mapWriteError)),
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

// Shared by exercise-library create, update, and merge operations.
function addMuscleGroups(
	sql: SqlClient.SqlClient,
	exerciseId: string,
	groups: NamedMuscleGroup[],
	concurrency: number | "unbounded" = 1,
) {
	return Effect.forEach(
		groups,
		(group) =>
			Effect.gen(function* () {
				const findOrCreateMuscleGroup = SqlSchema.findOne({
					Request: Schema.Struct({ name: Schema.String, normalizedName: Schema.String }),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (input) => sql`
				INSERT INTO muscle_groups (name, normalized_name) VALUES (${input.name}, ${input.normalizedName})
				ON CONFLICT (normalized_name) DO UPDATE SET normalized_name = EXCLUDED.normalized_name RETURNING id
			`,
				});

				const muscleGroup = yield* findOrCreateMuscleGroup(group);

				yield* sql`INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
			VALUES (${exerciseId}::uuid, ${muscleGroup.id}::uuid) ON CONFLICT DO NOTHING`;
			}),
		{ concurrency, discard: true },
	);
}

function replaceMuscleGroups(
	sql: SqlClient.SqlClient,
	exerciseId: string,
	groups: NamedMuscleGroup[],
) {
	return Effect.gen(function* () {
		const findCurrentMuscleGroups = SqlSchema.findAll({
			Request: Schema.String,
			Result: Schema.Struct({ normalizedName: Schema.String }),
			execute: (id) => sql`
				SELECT mg.normalized_name AS "normalizedName" FROM exercise_muscle_groups emg
				JOIN muscle_groups mg ON mg.id = emg.muscle_group_id WHERE emg.exercise_id = ${id}::uuid
			`,
		});

		const current = yield* findCurrentMuscleGroups(exerciseId);

		const currentNames = current.map((group) => group.normalizedName).toSorted();
		const incomingNames = groups.map((group) => group.normalizedName).toSorted();

		if (
			currentNames.length === incomingNames.length &&
			currentNames.every((name, index) => name === incomingNames[index])
		)
			return;
		yield* sql`DELETE FROM exercise_muscle_groups WHERE exercise_id = ${exerciseId}::uuid`;
		yield* addMuscleGroups(sql, exerciseId, groups, "unbounded");
	});
}
