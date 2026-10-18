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
		readonly findOrCreateExercises: (input: {
			userId: string;
			exercises: PreparedWorkoutWriteExercise[];
		}) => Effect.Effect<WorkoutExerciseWithDatabaseId[], DatabaseError>;
	}
>()("horus/WorkoutExerciseDb") {}

export const workoutExerciseDb = Layer.effect(
	WorkoutExerciseDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			findOrCreateExercises: ({ userId, exercises }) =>
				Effect.forEach(
					exercises,
					(exercise) =>
						Effect.gen(function* () {
							const normalizedName = exercise.global.normalizedName;

							const findExercise = SqlSchema.findOneOption({
								Request: Schema.Struct({ userId: Schema.String, normalizedName: Schema.String }),
								Result: Schema.Struct({ id: Schema.String }),
								execute: (input) => sql`
									SELECT id FROM exercises WHERE user_id = ${input.userId}
									AND normalized_name = ${input.normalizedName} LIMIT 1
								`,
							});

							const existing = yield* findExercise({
								userId,
								normalizedName,
							});

							if (Option.isSome(existing)) return { ...exercise, exerciseId: existing.value.id };

							const insertExercise = SqlSchema.findOneOption({
								Request: Schema.Struct({
									userId: Schema.String,
									name: Schema.String,
									normalizedName: Schema.String,
								}),
								Result: Schema.Struct({ id: Schema.String }),
								execute: (input) => sql`
									INSERT INTO exercises (user_id, name, normalized_name)
									VALUES (${input.userId}, ${input.name}, ${input.normalizedName})
									ON CONFLICT (user_id, normalized_name) DO NOTHING RETURNING id
								`,
							});

							const created = yield* insertExercise({
								userId,
								name: exercise.global.name,
								normalizedName,
							});

							const storedExercise = yield* findExercise({
								userId,
								normalizedName,
							});

							if (Option.isNone(storedExercise))
								return yield* Effect.fail(
									new DatabaseError({
										cause: new Error("Exercise was not found after the insert"),
									}),
								);

							const groups = exercise.global.muscleGroups;

							if (Option.isSome(created) && groups.length > 0) {
								// Preserve existing display names and link only groups from the winning exercise insert.
								yield* sql`
									WITH upserted_groups AS (
										INSERT INTO muscle_groups (name, normalized_name)
										SELECT * FROM unnest(
											${groups.map((group) => group.name)}::text[],
											${groups.map((group) => group.normalizedName)}::text[]
										) WHERE true
										ON CONFLICT (normalized_name) DO UPDATE
											SET normalized_name = EXCLUDED.normalized_name RETURNING id
									)
									INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
									SELECT ${storedExercise.value.id}::uuid, id FROM upserted_groups WHERE true ON CONFLICT DO NOTHING
								`;
							}

							return { ...exercise, exerciseId: storedExercise.value.id };
						}),
					{ concurrency: "unbounded" },
				).pipe(withDatabaseError),
		};
	}),
);
