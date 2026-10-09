import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import { Context, Effect, Layer } from "effect";
import {
	deleteAllWorkouts,
	getWorkoutDetails,
	getWorkoutExerciseRows,
	getWorkoutSetRows,
	listWorkoutHistory,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DatabaseError } from "@/lib/db/database";

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

export const workoutDb = Layer.succeed(WorkoutDb, {
	getWorkoutForEdit: ({ workoutId, userId }) =>
		Effect.gen(function* () {
			const [workoutRows, exerciseRows, setRows] = yield* Effect.all(
				[
					Effect.tryPromise({
						try: () => prisma.$queryRawTyped(getWorkoutDetails(workoutId, userId)),
						catch: (cause) => new DatabaseError({ cause }),
					}),
					Effect.tryPromise({
						try: () => prisma.$queryRawTyped(getWorkoutExerciseRows(workoutId)),
						catch: (cause) => new DatabaseError({ cause }),
					}),
					Effect.tryPromise({
						try: () => prisma.$queryRawTyped(getWorkoutSetRows(workoutId)),
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
					prisma.$queryRawTyped(listWorkoutHistory(query.userId, query.limit + 1, query.offset)),
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
				try: () => prisma.$queryRawTyped(deleteAllWorkouts(userId)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			if (!result || result.deleted_count === null) {
				return yield* Effect.fail(
					new DatabaseError({ cause: new Error("Delete workout count query returned no count") }),
				);
			}

			return { deletedCount: result.deleted_count };
		}),
});
