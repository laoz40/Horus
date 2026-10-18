import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";

type NamedMuscleGroup = { name: string; normalizedName: string };

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

export type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: NamedMuscleGroup[];
	};
};

export type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

export class WorkoutExerciseDb extends Context.Service<
	WorkoutExerciseDb,
	{
		readonly findExercise: (input: {
			userId: string;
			normalizedName: string;
		}) => Effect.Effect<string | null, DatabaseError>;
		readonly insertExerciseIfMissing: (input: {
			userId: string;
			name: string;
			normalizedName: string;
		}) => Effect.Effect<string | null, DatabaseError>;
		readonly addMuscleGroups: (input: {
			exerciseId: string;
			groups: NamedMuscleGroup[];
		}) => Effect.Effect<void, DatabaseError>;
	}
>()("horus/WorkoutExerciseDb") {}

export const workoutExerciseDb = Layer.effect(
	WorkoutExerciseDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			findExercise: (input) => {
				const findExerciseQuery = SqlSchema.findOneOption({
					Request: Schema.Struct({ userId: Schema.String, normalizedName: Schema.String }),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (query) => sql`
						SELECT id FROM exercises WHERE user_id = ${query.userId}
						AND normalized_name = ${query.normalizedName} LIMIT 1
					`,
				});

				return findExerciseQuery(input).pipe(
					Effect.map((row) => (Option.isSome(row) ? row.value.id : null)),
					withDatabaseError,
				);
			},
			insertExerciseIfMissing: (input) => {
				const insertExerciseQuery = SqlSchema.findOneOption({
					Request: Schema.Struct({
						userId: Schema.String,
						name: Schema.String,
						normalizedName: Schema.String,
					}),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (query) => sql`
						INSERT INTO exercises (user_id, name, normalized_name)
						VALUES (${query.userId}, ${query.name}, ${query.normalizedName})
						ON CONFLICT (user_id, normalized_name) DO NOTHING RETURNING id
					`,
				});

				return insertExerciseQuery(input).pipe(
					Effect.map((row) => (Option.isSome(row) ? row.value.id : null)),
					withDatabaseError,
				);
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
		};
	}),
);
