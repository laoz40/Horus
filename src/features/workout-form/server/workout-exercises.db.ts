import "server-only";

import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";
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
		readonly find: (input: {
			userId: string;
			names: string[];
		}) => Effect.Effect<readonly StoredExercise[], DatabaseError>;
		readonly create: (input: {
			userId: string;
			exercises: ExerciseGlobal[];
		}) => Effect.Effect<readonly StoredExercise[], DatabaseError>;
	}
>()("horus/WorkoutExerciseDb") {}

const ExerciseRows = Schema.Array(
	Schema.Struct({ id: Schema.String, normalizedName: Schema.String }),
);

export type StoredExercise = (typeof ExerciseRows.Type)[number];

type ExerciseGlobal = PreparedWorkoutWriteExercise["global"];

function addMuscleGroups({
	sql,
	exercises,
	inserted,
}: {
	sql: SqlClient.SqlClient;
	exercises: ExerciseGlobal[];
	inserted: readonly StoredExercise[];
}) {
	const insertedIds = new Map(inserted.map((row) => [row.normalizedName, row.id]));

	const groups = exercises.flatMap((exercise) => {
		const exerciseId = insertedIds.get(exercise.normalizedName);

		if (exerciseId === undefined) return [];

		return exercise.muscleGroups.map((group) => ({ ...group, exerciseId }));
	});

	if (groups.length === 0) return Effect.void;

	return sql`
		WITH incoming AS (
			SELECT * FROM unnest(
				${groups.map((group) => group.exerciseId)}::uuid[],
				${groups.map((group) => group.name)}::text[],
				${groups.map((group) => group.normalizedName)}::text[]
			) AS rows(exercise_id, name, normalized_name)
		), upserted_groups AS (
			INSERT INTO muscle_groups (name, normalized_name)
			SELECT DISTINCT ON (normalized_name) name, normalized_name FROM incoming
			WHERE true ON CONFLICT (normalized_name) DO UPDATE
				SET normalized_name = EXCLUDED.normalized_name
			RETURNING id, normalized_name
		)
		INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
		SELECT incoming.exercise_id, upserted_groups.id FROM incoming
		JOIN upserted_groups USING (normalized_name)
		WHERE true ON CONFLICT DO NOTHING
	`;
}

export const workoutExerciseDb = Layer.effect(
	WorkoutExerciseDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			find: ({ userId, names }) =>
				sql`
				SELECT id, normalized_name AS "normalizedName" FROM exercises
				WHERE user_id = ${userId} AND normalized_name = ANY(${names}::text[])
			`.pipe(Effect.flatMap(Schema.decodeUnknownEffect(ExerciseRows)), withDatabaseError),
			create: ({ userId, exercises }) =>
				Effect.gen(function* () {
					const inserted = yield* sql`
						INSERT INTO exercises (user_id, name, normalized_name)
						SELECT ${userId}, name, normalized_name FROM unnest(
							${exercises.map((exercise) => exercise.name)}::text[],
							${exercises.map((exercise) => exercise.normalizedName)}::text[]
						) AS incoming(name, normalized_name)
						RETURNING id, normalized_name AS "normalizedName"
					`.pipe(Effect.flatMap(Schema.decodeUnknownEffect(ExerciseRows)));

					yield* addMuscleGroups({ sql, exercises, inserted });

					return inserted;
				}).pipe(withDatabaseError),
		};
	}),
);
