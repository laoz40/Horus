import "server-only";

import { Context, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import type {
	PreparedWorkoutWriteExercise,
	WorkoutExerciseWithDatabaseId,
} from "@/features/workout-form/server/workout-exercises.db";
import type { PrSetUpdate } from "@/features/personal-records/server/pr-history.functions";
import { DatabaseError, withDatabaseError } from "@/lib/db/database";

type WorkoutWriteInput = {
	userId: string;
	workout: Omit<WorkoutForSave, "exercises"> & { exercises: PreparedWorkoutWriteExercise[] };
};

export type WorkoutUpdateInput = WorkoutWriteInput & { workoutId: string };

export class WorkoutFormDb extends Context.Service<
	WorkoutFormDb,
	{
		readonly create: (input: WorkoutWriteInput) => Effect.Effect<string, DatabaseError>;
		readonly saveContent: (input: {
			workoutId: string;
			exercises: WorkoutExerciseWithDatabaseId[];
			prStatusesBySetId: ReadonlyMap<string, PrSetUpdate>;
			totalPrSets: number;
		}) => Effect.Effect<void, DatabaseError>;
		readonly replaceContent: (input: {
			update: WorkoutUpdateInput;
			exercises: WorkoutExerciseWithDatabaseId[];
		}) => Effect.Effect<void, DatabaseError>;
		readonly getForUpdate: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<{ id: string; name: string; createdAt: Date } | null, DatabaseError>;
		readonly getExerciseIds: (workoutId: string) => Effect.Effect<string[], DatabaseError>;
	}
>()("horus/WorkoutFormDb") {}

export const workoutFormDb = Layer.effect(
	WorkoutFormDb,
	Effect.gen(function* () {
		const sql = yield* SqlClient.SqlClient;

		return {
			create: ({ userId, workout }) => {
				const insertWorkout = SqlSchema.findOne({
					Request: Schema.Struct({
						userId: Schema.String,
						name: Schema.String,
						durationSeconds: Schema.NullOr(Schema.Int),
					}),
					Result: Schema.Struct({ id: Schema.String }),
					execute: (input) => sql`
				INSERT INTO workouts (user_id, name, duration_seconds)
				VALUES (${input.userId}, ${input.name}, ${input.durationSeconds}) RETURNING id
			`,
				});

				return insertWorkout({
					userId,
					name: workout.name,
					durationSeconds: workout.durationSeconds,
				}).pipe(
					Effect.map((row) => row.id),
					withDatabaseError,
				);
			},
			saveContent: ({ workoutId, exercises, prStatusesBySetId, totalPrSets }) =>
				Effect.gen(function* () {
					yield* insertWorkoutContent(sql, workoutId, exercises, prStatusesBySetId);
					yield* sql`UPDATE workouts SET total_pr_sets = ${totalPrSets} WHERE id = ${workoutId}::uuid`;
				}).pipe(withDatabaseError),
			replaceContent: ({ update, exercises }) =>
				Effect.gen(function* () {
					yield* sql`
				UPDATE workouts SET name = ${update.workout.name},
					duration_seconds = ${update.workout.durationSeconds}, total_pr_sets = 0
				WHERE id = ${update.workoutId}::uuid AND user_id = ${update.userId}
			`;
					yield* sql`DELETE FROM workout_exercises WHERE workout_id = ${update.workoutId}::uuid`;
					yield* insertWorkoutContent(sql, update.workoutId, exercises);
				}).pipe(withDatabaseError),
			getForUpdate: (query) => {
				const findWorkoutForUpdate = SqlSchema.findOneOption({
					Request: Schema.Struct({ workoutId: Schema.String, userId: Schema.String }),
					Result: Schema.Struct({ id: Schema.String, name: Schema.String, createdAt: Schema.Date }),
					execute: (input) => sql`
				SELECT id, name, created_at AS "createdAt" FROM workouts
				WHERE id = ${input.workoutId}::uuid AND user_id = ${input.userId} LIMIT 1 FOR UPDATE
			`,
				});

				return findWorkoutForUpdate(query).pipe(Effect.map(Option.getOrNull), withDatabaseError);
			},
			getExerciseIds: (workoutId) => {
				const findExerciseIds = SqlSchema.findAll({
					Request: Schema.String,
					Result: Schema.Struct({ exerciseId: Schema.String }),
					execute: (id) =>
						sql`SELECT DISTINCT exercise_id AS "exerciseId" FROM workout_exercises WHERE workout_id = ${id}::uuid`,
				});

				return findExerciseIds(workoutId).pipe(
					Effect.map((rows) => rows.map((row) => row.exerciseId)),
					withDatabaseError,
				);
			},
		} satisfies WorkoutFormDb["Service"];
	}),
);

// Create and edit write the same child rows, with calculated PR flags supplied on creation.
function insertWorkoutContent(
	sql: SqlClient.SqlClient,
	workoutId: string,
	exercises: WorkoutExerciseWithDatabaseId[],
	prStatusesBySetId: ReadonlyMap<string, PrSetUpdate> = new Map(),
) {
	return Effect.gen(function* () {
		const exerciseRows = exercises.map((exercise, position) => ({
			id: exercise.id,
			workout_id: workoutId,
			exercise_id: exercise.exerciseId,
			position,
			difficulty: exercise.difficulty,
			notes: exercise.notes ?? "",
		}));

		yield* Effect.forEach(
			chunkRows(exerciseRows),
			(chunk) => sql`INSERT INTO workout_exercises ${sql.insert(chunk)}`,
			{ discard: true },
		);

		const setRows = exercises.flatMap((exercise) =>
			exercise.sets.map((set, position) => {
				const status = prStatusesBySetId.get(set.id);

				return {
					id: set.id,
					workout_exercise_id: exercise.id,
					position,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
					is_weight_pr: status?.isWeightPr ?? false,
					is_volume_pr: status?.isVolumePr ?? false,
					is_bodyweight_reps_pr: status?.isBodyweightRepsPr ?? false,
				};
			}),
		);

		yield* Effect.forEach(
			chunkRows(setRows),
			(chunk) => sql`INSERT INTO workout_sets ${sql.insert(chunk)}`,
			{ discard: true },
		);
	});
}

function chunkRows<A>(rows: A[]) {
	const chunks: A[][] = [];

	// Nine parameters per set. Keep bulk inserts below PostgreSQL's parameter limit.
	for (let offset = 0; offset < rows.length; offset += 4000)
		chunks.push(rows.slice(offset, offset + 4000));

	return chunks;
}
