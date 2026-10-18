import "server-only";

import { Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { withTransaction } from "@/lib/db/sql";
import {
	WorkoutExerciseDb,
	type PreparedWorkoutWriteExercise,
} from "@/features/workout-form/server/workout-exercises.db";
import { DatabaseError } from "@/lib/db/database";
import { WorkoutFormDb } from "@/features/workout-form/server/workout-form.db";
import type { WorkoutUpdateInput } from "@/features/workout-form/server/workout-form.db";
import {
	calculateSetPrsFromHistory,
	recalculateExercisePrHistory,
} from "@/features/personal-records/server/pr-history.service";
import {
	buildAffectedExerciseIds,
	buildPrTotalsByWorkoutId,
} from "@/features/personal-records/server/pr-history.functions";
import { requireWorkout } from "@/features/workout-view/server/workout-view.functions";
import {
	buildNewWorkoutPrSets,
	normalizeWorkoutForWrite,
	validateUniqueWorkoutChildIds,
} from "@/features/workout-form/server/workout-form.functions";

type WorkoutSaveInput = {
	userId: string;
	workout: WorkoutForSave;
};

const findOrCreateWorkoutExercises = (input: {
	userId: string;
	exercises: PreparedWorkoutWriteExercise[];
}) =>
	Effect.gen(function* () {
		const db = yield* WorkoutExerciseDb;

		return yield* Effect.forEach(
			input.exercises,
			(exercise) =>
				Effect.gen(function* () {
					const lookup = { userId: input.userId, normalizedName: exercise.global.normalizedName };
					const existingId = yield* db.findExercise(lookup);

					if (existingId !== null) return { ...exercise, exerciseId: existingId };

					const insertedId = yield* db.insertExerciseIfMissing({
						...lookup,
						name: exercise.global.name,
					});

					const exerciseId = yield* db.findExercise(lookup);

					if (exerciseId === null)
						return yield* Effect.fail(
							new DatabaseError({
								cause: new Error("Exercise was not found after the insert"),
							}),
						);

					// Only this insert's winner attaches groups; existing exercises keep their groups.
					if (insertedId !== null)
						yield* db.addMuscleGroups({ exerciseId, groups: exercise.global.muscleGroups });

					return { ...exercise, exerciseId };
				}),
			{ concurrency: "unbounded" },
		);
	});

export const createWorkout = (createInput: WorkoutSaveInput) =>
	Effect.gen(function* () {
		const workout = yield* validateAndNormalizeWorkout(createInput.workout);

		return yield* withTransaction(
			Effect.gen(function* () {
				const workouts = yield* WorkoutFormDb;
				const workoutId = yield* workouts.create({ ...createInput, workout });

				const exercisesWithDatabaseIds = yield* findOrCreateWorkoutExercises({
					userId: createInput.userId,
					exercises: workout.exercises,
				});

				const newWorkoutSets = buildNewWorkoutPrSets(workoutId, exercisesWithDatabaseIds);

				const prStatuses = yield* calculateSetPrsFromHistory({
					userId: createInput.userId,
					sets: newWorkoutSets,
				});

				const prStatusesBySetId = new Map(prStatuses.map((status) => [status.setId, status]));
				const totalPrSets = buildPrTotalsByWorkoutId(prStatuses).get(workoutId) ?? 0;
				yield* workouts.insertExercises({ workoutId, exercises: exercisesWithDatabaseIds });
				yield* workouts.insertSets({ exercises: exercisesWithDatabaseIds, prStatusesBySetId });
				yield* workouts.updatePrTotal({ workoutId, totalPrSets });

				return workoutId;
			}),
		);
	});

const updateWorkoutAndRecalculatePrs = (updateInput: WorkoutUpdateInput) =>
	withTransaction(
		Effect.gen(function* () {
			const workouts = yield* WorkoutFormDb;

			const workout = yield* workouts.getForUpdate({
				workoutId: updateInput.workoutId,
				userId: updateInput.userId,
			});

			if (!workout) return null;
			const previousExerciseIds = yield* workouts.getExerciseIds(updateInput.workoutId);

			const exercisesWithDatabaseIds = yield* findOrCreateWorkoutExercises({
				userId: updateInput.userId,
				exercises: updateInput.workout.exercises,
			});

			const affectedExerciseIds = buildAffectedExerciseIds(
				previousExerciseIds,
				exercisesWithDatabaseIds.map((exercise) => exercise.exerciseId),
			);

			yield* workouts.updateFields(updateInput);
			yield* workouts.deleteExercises(updateInput.workoutId);
			yield* workouts.insertExercises({
				workoutId: updateInput.workoutId,
				exercises: exercisesWithDatabaseIds,
			});
			yield* workouts.insertSets({ exercises: exercisesWithDatabaseIds });
			yield* recalculateExercisePrHistory({
				userId: updateInput.userId,
				exerciseIds: affectedExerciseIds,
				cutoff: { workoutId: workout.id, createdAt: workout.createdAt },
			});

			return workout.id;
		}),
	);

const validateAndNormalizeWorkout = (workout: WorkoutForSave) =>
	Effect.gen(function* () {
		yield* validateUniqueWorkoutChildIds(workout);

		return normalizeWorkoutForWrite(workout);
	});

export const updateWorkout = (updateInput: WorkoutSaveInput & { workoutId: string }) =>
	Effect.gen(function* () {
		const workout = yield* validateAndNormalizeWorkout(updateInput.workout);
		const workoutId = yield* updateWorkoutAndRecalculatePrs({ ...updateInput, workout });

		return yield* requireWorkout(workoutId);
	});
