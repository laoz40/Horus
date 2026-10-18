import "server-only";

import { Effect } from "effect";
import { Transactions } from "@/server/transactions";
import { WorkoutDb } from "@/features/workout-form/server/workouts.db";
import {
	WorkoutHistoryDb,
	type ListWorkoutsQuery,
} from "@/features/workout-history/server/workout-history.db";
import { recalculateExercisePrHistory } from "@/features/personal-records/server/pr-history.service";
import { requireWorkout } from "@/features/workout-view/server/workout-view.functions";
import {
	buildWorkoutHistoryPage,
	requireDeletedWorkouts,
} from "@/features/workout-history/server/workout-history.functions";

export const listWorkouts = (query: ListWorkoutsQuery) =>
	Effect.gen(function* () {
		const db = yield* WorkoutHistoryDb;
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
