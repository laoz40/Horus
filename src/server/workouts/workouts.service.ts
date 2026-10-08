import "server-only";

import { Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { Database, DatabaseError } from "@/lib/db/database";
import { findOrCreateWorkoutExercises } from "@/server/exercises/library/workout-exercises.repository";
import {
	deleteWorkoutById,
	deleteAllWorkoutRows,
	deleteWorkoutChildren,
	getWorkout,
	getWorkoutExerciseIds,
	getWorkoutForEdit,
	insertWorkoutExerciseRows,
	insertWorkoutRow,
	insertWorkoutSetRows,
	listWorkoutRows,
	updateWorkoutFields,
	updateWorkoutPrTotal,
	type ListWorkoutsQuery,
	type WorkoutUpdateInput,
	type WorkoutWriteInput,
} from "@/server/workouts/workouts.repository";
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
		const { prisma } = yield* Database;

		return yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx) => {
					const workoutId = await insertWorkoutRow(tx, createInput);

					const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(
						tx,
						createInput.userId,
						createInput.workout.exercises,
					);

					const newWorkoutSets = buildNewWorkoutPrSets(workoutId, exercisesWithDatabaseIds);

					const prStatuses = await calculateSetPrsFromHistory(
						tx,
						createInput.userId,
						newWorkoutSets,
					);

					const prStatusesBySetId = new Map(prStatuses.map((status) => [status.setId, status]));
					const totalPrSets = buildPrTotalsByWorkoutId(prStatuses).get(workoutId) ?? 0;

					await insertWorkoutExerciseRows(tx, workoutId, exercisesWithDatabaseIds);
					await insertWorkoutSetRows(tx, exercisesWithDatabaseIds, prStatusesBySetId);
					await updateWorkoutPrTotal(tx, workoutId, totalPrSets);

					return workoutId;
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

const updateWorkoutAndRecalculatePrs = (updateInput: WorkoutUpdateInput) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;

		return yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx): Promise<string | null> => {
					const workout = await getWorkout(tx, updateInput.workoutId, updateInput.userId);

					if (!workout) {
						return null;
					}

					const previousExerciseIds = await getWorkoutExerciseIds(tx, updateInput.workoutId);

					const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(
						tx,
						updateInput.userId,
						updateInput.workout.exercises,
					);

					const affectedExerciseIds = buildAffectedExerciseIds(
						previousExerciseIds,
						exercisesWithDatabaseIds.map((exercise) => exercise.exerciseId),
					);

					await updateWorkoutFields(tx, updateInput);
					await deleteWorkoutChildren(tx, updateInput.workoutId);
					await insertWorkoutExerciseRows(tx, updateInput.workoutId, exercisesWithDatabaseIds);
					await insertWorkoutSetRows(tx, exercisesWithDatabaseIds);
					await recalculateExercisePrHistory(tx, updateInput.userId, affectedExerciseIds, {
						workoutId: workout.id,
						createdAt: workout.createdAt,
					});

					return workout.id;
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

const deleteWorkoutAndRecalculatePrs = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;

		return yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx) => {
					const workout = await getWorkout(tx, workoutId, userId);

					if (!workout) {
						return null;
					}

					const exerciseIds = await getWorkoutExerciseIds(tx, workoutId);
					await deleteWorkoutById(tx, workoutId, userId);
					await recalculateExercisePrHistory(tx, userId, exerciseIds, {
						workoutId: workout.id,
						createdAt: workout.createdAt,
					});

					return { id: workout.id, name: workout.name };
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});

export const getWorkoutById = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const workout = yield* getWorkoutForEdit(workoutId, userId);
		const requiredWorkout = yield* requireWorkout(workout);

		return buildWorkoutEditForm(requiredWorkout);
	});

export const listWorkouts = (query: ListWorkoutsQuery) =>
	Effect.gen(function* () {
		const rows = yield* listWorkoutRows(query);

		return buildWorkoutHistoryPage(rows, query);
	});

export const deleteWorkout = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const workout = yield* deleteWorkoutAndRecalculatePrs(workoutId, userId);

		return yield* requireWorkout(workout);
	});

export const deleteAllWorkouts = (userId: string) =>
	Effect.gen(function* () {
		const result = yield* deleteAllWorkoutRows(userId);

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
