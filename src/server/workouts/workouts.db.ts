import "server-only";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import type {
	PreparedWorkoutWriteExercise,
	WorkoutExerciseWithDatabaseId,
} from "@/server/exercises/library/workout-exercises.repository";
import type { PrSetUpdate } from "@/server/exercises/pr-history/pr-history.functions";
import {
	insertWorkoutExerciseRows,
	insertWorkoutSetRows,
} from "@/server/workouts/workouts.repository";
import type { Decimal } from "@prisma/client/runtime/client";
import { Context, Effect, Layer } from "effect";
import {
	deleteAllWorkouts,
	deleteWorkoutById,
	getWorkoutForUpdate,
	getWorkoutExerciseIds,
	getWorkoutDetails,
	getWorkoutExerciseRows,
	getWorkoutSetRows,
	listWorkoutHistory,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";
import { DatabaseError } from "@/lib/db/database";

export type WorkoutWriteInput = {
	userId: string;
	workout: Omit<WorkoutForSave, "exercises"> & {
		exercises: PreparedWorkoutWriteExercise[];
	};
};

export type WorkoutUpdateInput = WorkoutWriteInput & { workoutId: string };

export type ListWorkoutsQuery = {
	userId: string;
	limit: number;
	offset: number;
};

export type WorkoutForEdit = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	exercises: Array<{
		id: string;
		exerciseId: string;
		name: string;
		muscleGroups: string[];
		difficulty: number | null;
		notes: string;
		sets: Array<{
			id: string;
			weight: number;
			reps: number;
			completed: boolean;
			isWeightPr: boolean;
			isVolumePr: boolean;
			isBodyweightRepsPr: boolean;
		}>;
	}>;
};

export type WorkoutHistoryRow = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	totalPrSets: number;
	exerciseCount: number;
	totalVolume: number;
	muscleGroups: string[];
};

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

export class WorkoutDb extends Context.Service<
	WorkoutDb,
	{
		readonly create: (input: WorkoutWriteInput) => Effect.Effect<string, DatabaseError>;
		readonly saveContent: (input: {
			workoutId: string;
			exercises: WorkoutExerciseWithDatabaseId[];
			prStatusesBySetId: ReadonlyMap<string, PrSetUpdate>;
			totalPrSets: number;
		}) => Effect.Effect<void, DatabaseError>;
		readonly getForUpdate: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<{ id: string; name: string; createdAt: Date } | null, DatabaseError>;
		readonly getExerciseIds: (workoutId: string) => Effect.Effect<string[], DatabaseError>;
		readonly delete: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<void, DatabaseError>;
		readonly getWorkoutForEdit: (query: {
			workoutId: string;
			userId: string;
		}) => Effect.Effect<WorkoutForEdit | null, DatabaseError>;
		readonly listWorkouts: (
			query: ListWorkoutsQuery,
		) => Effect.Effect<WorkoutHistoryRow[], DatabaseError>;
		readonly deleteAllWorkouts: (
			userId: string,
		) => Effect.Effect<{ deletedCount: number }, DatabaseError>;
	}
>()("horus/WorkoutDb") {}

export const workoutDbLayer = Layer.effect(
	WorkoutDb,
	Effect.gen(function* () {
		const connection = yield* DbConnection;

		return {
			create: (input) =>
				Effect.tryPromise({
					try: async () => {
						const row = await connection.workouts.create({
							data: {
								user_id: input.userId,
								name: input.workout.name,
								duration_seconds: input.workout.durationSeconds,
							},
							select: { id: true },
						});

						return row.id;
					},
					catch: (cause) => new DatabaseError({ cause }),
				}),
			saveContent: ({ workoutId, exercises, prStatusesBySetId, totalPrSets }) =>
				Effect.tryPromise({
					try: async () => {
						await insertWorkoutExerciseRows(connection, workoutId, exercises);
						await insertWorkoutSetRows(connection, exercises, prStatusesBySetId);
						await connection.workouts.update({
							where: { id: workoutId },
							data: { total_pr_sets: totalPrSets },
						});
					},
					catch: (cause) => new DatabaseError({ cause }),
				}),
			getForUpdate: ({ workoutId, userId }) =>
				Effect.gen(function* () {
					const [row] = yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(getWorkoutForUpdate(workoutId, userId)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return row ? { id: row.id, name: row.name, createdAt: row.created_at } : null;
				}),
			getExerciseIds: (workoutId) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(getWorkoutExerciseIds(workoutId)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map((row) => row.exercise_id);
				}),
			delete: ({ workoutId, userId }) =>
				Effect.gen(function* () {
					yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(deleteWorkoutById(workoutId, userId)),
						catch: (cause) => new DatabaseError({ cause }),
					});
				}),
			getWorkoutForEdit: ({ workoutId, userId }) =>
				Effect.gen(function* () {
					const [workoutRows, exerciseRows, setRows] = yield* Effect.all(
						[
							Effect.tryPromise({
								try: () => connection.$queryRawTyped(getWorkoutDetails(workoutId, userId)),
								catch: (cause) => new DatabaseError({ cause }),
							}),
							Effect.tryPromise({
								try: () => connection.$queryRawTyped(getWorkoutExerciseRows(workoutId)),
								catch: (cause) => new DatabaseError({ cause }),
							}),
							Effect.tryPromise({
								try: () => connection.$queryRawTyped(getWorkoutSetRows(workoutId)),
								catch: (cause) => new DatabaseError({ cause }),
							}),
						],
						{ concurrency: "unbounded" },
					);

					const workout = workoutRows[0];

					if (!workout) {
						return null;
					}

					return {
						id: workout.id,
						createdAt: workout.created_at,
						name: workout.name,
						durationSeconds: workout.duration_seconds,
						exercises: exerciseRows.map((exercise) => ({
							id: exercise.id,
							exerciseId: exercise.exercise_id,
							name: exercise.name,
							muscleGroups: exercise.muscle_groups ?? [],
							difficulty: exercise.difficulty ? decimalToNumber(exercise.difficulty) : null,
							notes: exercise.notes,
							sets: setRows
								.filter((set) => set.workout_exercise_id === exercise.id)
								.map((set) => ({
									id: set.id,
									weight: decimalToNumber(set.weight),
									reps: decimalToNumber(set.reps),
									completed: set.completed,
									isWeightPr: set.is_weight_pr,
									isVolumePr: set.is_volume_pr,
									isBodyweightRepsPr: set.is_bodyweight_reps_pr,
								})),
						})),
					};
				}),
			listWorkouts: (query) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () =>
							connection.$queryRawTyped(
								listWorkoutHistory(query.userId, query.limit + 1, query.offset),
							),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map(
						(row): WorkoutHistoryRow => ({
							id: row.id,
							createdAt: row.created_at,
							name: row.name,
							durationSeconds: row.duration_seconds,
							totalPrSets: row.total_pr_sets,
							exerciseCount: row.exercise_count ?? 0,
							totalVolume: row.total_volume ?? 0,
							muscleGroups: row.muscle_groups ?? [],
						}),
					);
				}),
			deleteAllWorkouts: (userId) =>
				Effect.gen(function* () {
					const [result] = yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(deleteAllWorkouts(userId)),
						catch: (cause) => new DatabaseError({ cause }),
					});

					if (!result || result.deleted_count === null) {
						return yield* Effect.fail(
							new DatabaseError({
								cause: new Error("Delete workout count query returned no count"),
							}),
						);
					}

					return { deletedCount: result.deleted_count };
				}),
		} satisfies WorkoutDb["Service"];
	}),
);

export const workoutDb = workoutDbLayer.pipe(Layer.provide(Layer.succeed(DbConnection, prisma)));
