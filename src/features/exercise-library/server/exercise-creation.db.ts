import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";
import { sqlClient } from "@/lib/db/sql";
import type {
	ExerciseWriteInput,
	UserExerciseLibraryRow,
} from "@/features/exercise-library/server/exercises.db";

const namedRowSchema = Schema.Struct({
	name: Schema.String,
	normalizedName: Schema.String,
});

export class ExerciseCreationDb extends Context.Service<
	ExerciseCreationDb,
	{
		readonly create: (
			input: ExerciseWriteInput,
		) => Effect.Effect<UserExerciseLibraryRow, DatabaseError>;
	}
>()("horus/ExerciseCreationDb") {}

export const exerciseCreationDb = Layer.effect(
	ExerciseCreationDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		const insertExercise = SqlSchema.findOne({
			Request: Schema.Struct({ userId: Schema.String, ...namedRowSchema.fields }),
			Result: Schema.Struct({ id: Schema.String }),
			execute: (input) => sql`
				INSERT INTO exercises (user_id, name, normalized_name)
				VALUES (${input.userId}, ${input.name}, ${input.normalizedName})
				RETURNING id
			`,
		});

		const upsertMuscleGroup = SqlSchema.findOne({
			Request: namedRowSchema,
			Result: Schema.Struct({ id: Schema.String }),
			// Return the existing ID on conflict while preserving its display name.
			execute: (group) => sql`
				INSERT INTO muscle_groups (name, normalized_name)
				VALUES (${group.name}, ${group.normalizedName})
				ON CONFLICT (normalized_name) DO UPDATE
					SET normalized_name = EXCLUDED.normalized_name
				RETURNING id
			`,
		});

		const getCreatedExercise = SqlSchema.findOne({
			Request: Schema.String,
			Result: Schema.Struct({
				id: Schema.String,
				name: Schema.String,
				muscleGroups: Schema.mutable(Schema.Array(Schema.String)),
				workoutCount: Schema.Int,
			}),
			execute: (id) => sql`
				SELECT exercises.id, exercises.name,
					coalesce(
						array_agg(muscle_groups.name ORDER BY muscle_groups.name)
							FILTER (WHERE muscle_groups.name IS NOT NULL),
						array[]::text[]
					) AS "muscleGroups",
					0::int AS "workoutCount"
				FROM exercises
				LEFT JOIN exercise_muscle_groups ON exercise_muscle_groups.exercise_id = exercises.id
				LEFT JOIN muscle_groups ON muscle_groups.id = exercise_muscle_groups.muscle_group_id
				WHERE exercises.id = ${id}::uuid
				GROUP BY exercises.id
			`,
		});

		return {
			create: ({ userId, exercise }) =>
				sql
					.withTransaction(
						Effect.gen(function* () {
							const created = yield* insertExercise({ userId, ...exercise });

							for (const group of exercise.muscleGroups) {
								const muscleGroup = yield* upsertMuscleGroup(group);

								yield* sql`
								INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
								VALUES (${created.id}::uuid, ${muscleGroup.id}::uuid)
								ON CONFLICT DO NOTHING
							`;
							}

							return yield* getCreatedExercise(created.id);
						}),
					)
					.pipe(Effect.mapError((cause) => new DatabaseError({ cause }))),
		} satisfies ExerciseCreationDb["Service"];
	}),
).pipe(Layer.provide(sqlClient));
