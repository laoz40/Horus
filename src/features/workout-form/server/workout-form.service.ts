import "server-only";

import { Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { Transactions } from "@/server/transactions";
import { ExerciseDb } from "@/features/exercise-library/server/exercises.db";
import { WorkoutDb } from "@/features/workout-form/server/workouts.db";
import type { WorkoutUpdateInput } from "@/features/workout-form/server/workouts.db";
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

export const createWorkout = (createInput: WorkoutSaveInput) =>
	Effect.gen(function* () {
		const workout = yield* validateAndNormalizeWorkout(createInput.workout);
		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const workouts = yield* WorkoutDb;
				const exercises = yield* ExerciseDb;
				const workoutId = yield* workouts.create({ ...createInput, workout });

				const exercisesWithDatabaseIds = yield* exercises.resolveWorkoutExercises({
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
