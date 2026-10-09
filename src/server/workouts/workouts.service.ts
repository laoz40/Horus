import "server-only";

import { Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { Transactions } from "@/server/transactions";
import { ExerciseDb } from "@/server/exercises/library/exercises.db";
import { WorkoutDb } from "@/server/workouts/workouts.db";
import type {
	ListWorkoutsQuery,
	WorkoutWriteInput,
	WorkoutUpdateInput,
} from "@/server/workouts/workouts.db";
import {
	calculateSetPrsFromHistory,
	recalculateExercisePrHistory,
} from "@/server/exercises/pr-history/pr-history.service";
import {
	buildAffectedExerciseIds,
	buildPrTotalsByWorkoutId,
} from "@/server/exercises/pr-history/pr-history.functions";
import {
	buildNewWorkoutPrSets,
	buildWorkoutEditForm,
	buildWorkoutHistoryPage,
	normalizeWorkoutForWrite,
	requireDeletedWorkouts,
	requireWorkout,
	validateUniqueWorkoutChildIds,
} from "@/server/workouts/workouts.functions";

export const createWorkout = (createInput: WorkoutWriteInput) =>
	Effect.gen(function* () {
		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const workouts = yield* WorkoutDb;
				const exercises = yield* ExerciseDb;
				const workoutId = yield* workouts.create(createInput);

				const exercisesWithDatabaseIds = yield* exercises.resolveWorkoutExercises({
					userId: createInput.userId,
					exercises: createInput.workout.exercises,
				});

				const newWorkoutSets = buildNewWorkoutPrSets(workoutId, exercisesWithDatabaseIds);

				const prStatuses = yield* calculateSetPrsFromHistory({
					userId: createInput.userId,
					sets: newWorkoutSets,
				});

				const prStatusesBySetId = new Map(prStatuses.map((status) => [status.setId, status]));
				const totalPrSets = buildPrTotalsByWorkoutId(prStatuses).get(workoutId) ?? 0;
				yield* workouts.saveContent({
					workoutId,
					exercises: exercisesWithDatabaseIds,
					prStatusesBySetId,
					totalPrSets,
				});

				return workoutId;
			}),
		);
	});

const updateWorkoutAndRecalculatePrs = (updateInput: WorkoutUpdateInput) =>
	Effect.gen(function* () {
		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const workouts = yield* WorkoutDb;
				const exercises = yield* ExerciseDb;

				const workout = yield* workouts.getForUpdate({
					workoutId: updateInput.workoutId,
					userId: updateInput.userId,
				});

				if (!workout) return null;
				const previousExerciseIds = yield* workouts.getExerciseIds(updateInput.workoutId);

				const exercisesWithDatabaseIds = yield* exercises.resolveWorkoutExercises({
					userId: updateInput.userId,
					exercises: updateInput.workout.exercises,
				});

				const affectedExerciseIds = buildAffectedExerciseIds(
					previousExerciseIds,
					exercisesWithDatabaseIds.map((exercise) => exercise.exerciseId),
				);

				yield* workouts.replaceContent({
					update: updateInput,
					exercises: exercisesWithDatabaseIds,
				});
				yield* recalculateExercisePrHistory({
					userId: updateInput.userId,
					exerciseIds: affectedExerciseIds,
					cutoff: { workoutId: workout.id, createdAt: workout.createdAt },
				});

				return workout.id;
			}),
		);
	});

export const getWorkoutById = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const db = yield* WorkoutDb;
		const workout = yield* db.getWorkoutForEdit({ workoutId, userId });
		const requiredWorkout = yield* requireWorkout(workout);

		return buildWorkoutEditForm(requiredWorkout);
	});

export const listWorkouts = (query: ListWorkoutsQuery) =>
	Effect.gen(function* () {
		const db = yield* WorkoutDb;
		const rows = yield* db.listWorkouts(query);

		return buildWorkoutHistoryPage(rows, query);
	});

export const deleteWorkout = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const db = yield* WorkoutDb;
				const workout = yield* requireWorkout(yield* db.getForUpdate({ workoutId, userId }));
				const exerciseIds = yield* db.getExerciseIds(workoutId);
				yield* db.delete({ workoutId, userId });
				yield* recalculateExercisePrHistory({
					userId,
					exerciseIds,
					cutoff: { workoutId: workout.id, createdAt: workout.createdAt },
				});

				return { id: workout.id, name: workout.name };
			}),
		);
	});

export const deleteAllWorkouts = (userId: string) =>
	Effect.gen(function* () {
		const db = yield* WorkoutDb;
		const result = yield* db.deleteAllWorkouts(userId);

		return yield* requireDeletedWorkouts(result);
	});

export const validateAndNormalizeWorkout = (workout: WorkoutForSave) =>
	Effect.gen(function* () {
		yield* validateUniqueWorkoutChildIds(workout);

		return normalizeWorkoutForWrite(workout);
	});

export const updateWorkout = (updateInput: WorkoutUpdateInput) =>
	Effect.gen(function* () {
		const workoutId = yield* updateWorkoutAndRecalculatePrs(updateInput);

		return yield* requireWorkout(workoutId);
	});
