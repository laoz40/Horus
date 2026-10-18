import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { DatabaseError } from "@/lib/db/database";

const workoutQuerySchema = Schema.Struct({ workoutId: Schema.String, userId: Schema.String });

const workoutRowSchema = Schema.Struct({
	id: Schema.String,
	createdAt: Schema.Date,
	name: Schema.String,
	durationSeconds: Schema.NullOr(Schema.Int),
});

const exerciseRowSchema = Schema.Struct({
	id: Schema.String,
	exerciseId: Schema.String,
	name: Schema.String,
	muscleGroups: Schema.mutable(Schema.Array(Schema.String)),
	difficulty: Schema.NullOr(Schema.Number),
	notes: Schema.String,
});

const setRowSchema = Schema.Struct({
	id: Schema.String,
	workoutExerciseId: Schema.String,
	weight: Schema.Number,
	reps: Schema.Number,
	completed: Schema.Boolean,
	isWeightPr: Schema.Boolean,
	isVolumePr: Schema.Boolean,
	isBodyweightRepsPr: Schema.Boolean,
});

export type WorkoutForEdit = typeof workoutRowSchema.Type & {
	exercises: Array<
		typeof exerciseRowSchema.Type & {
			sets: Array<Omit<typeof setRowSchema.Type, "workoutExerciseId">>;
		}
	>;
};

export class WorkoutViewDb extends Context.Service<
	WorkoutViewDb,
	{
		readonly getWorkout: (
			query: typeof workoutQuerySchema.Type,
		) => Effect.Effect<WorkoutForEdit | null, DatabaseError>;
	}
>()("horus/WorkoutViewDb") {}

export const workoutViewDb = Layer.effect(
	WorkoutViewDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			getWorkout: (query) =>
				Effect.gen(function* () {
					const getWorkout = SqlSchema.findOneOption({
						Request: workoutQuerySchema,
						Result: workoutRowSchema,
						execute: ({ workoutId, userId }) => sql`
							SELECT id, created_at AS "createdAt", name, duration_seconds AS "durationSeconds"
							FROM workouts WHERE id = ${workoutId}::uuid AND user_id = ${userId} LIMIT 1
						`,
					});

					const workout = Option.getOrNull(yield* getWorkout(query));

					if (!workout) return null;

					const getExercises = SqlSchema.findAll({
						Request: Schema.String,
						Result: exerciseRowSchema,
						execute: (workoutId) => sql`
							SELECT we.id, e.id AS "exerciseId", e.name,
								coalesce(array_agg(mg.name ORDER BY mg.name)
									FILTER (WHERE mg.name IS NOT NULL), array[]::text[]) AS "muscleGroups",
								we.difficulty::double precision AS difficulty, we.notes
							FROM workout_exercises we
							JOIN exercises e ON e.id = we.exercise_id
							LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
							LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
							WHERE we.workout_id = ${workoutId}::uuid
							GROUP BY we.id, e.id ORDER BY we.position ASC
						`,
					});

					const getSets = SqlSchema.findAll({
						Request: Schema.String,
						Result: setRowSchema,
						execute: (workoutId) => sql`
							SELECT ws.id, ws.workout_exercise_id AS "workoutExerciseId",
								ws.weight::double precision AS weight, ws.reps::double precision AS reps,
								ws.completed, ws.is_weight_pr AS "isWeightPr", ws.is_volume_pr AS "isVolumePr",
								ws.is_bodyweight_reps_pr AS "isBodyweightRepsPr"
							FROM workout_sets ws JOIN workout_exercises we ON we.id = ws.workout_exercise_id
							WHERE we.workout_id = ${workoutId}::uuid ORDER BY ws.position ASC
						`,
					});

					const [exercises, sets] = yield* Effect.all(
						[getExercises(query.workoutId), getSets(query.workoutId)],
						{ concurrency: "unbounded" },
					);

					return {
						...workout,
						exercises: exercises.map((exercise) => ({
							...exercise,
							sets: sets
								.filter((set) => set.workoutExerciseId === exercise.id)
								.map((set) => ({
									id: set.id,
									weight: set.weight,
									reps: set.reps,
									completed: set.completed,
									isWeightPr: set.isWeightPr,
									isVolumePr: set.isVolumePr,
									isBodyweightRepsPr: set.isBodyweightRepsPr,
								})),
						})),
					};
				}).pipe(Effect.mapError((cause) => new DatabaseError({ cause }))),
		} satisfies WorkoutViewDb["Service"];
	}),
);
