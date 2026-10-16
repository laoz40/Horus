import "server-only";

import { Effect } from "effect";
import { WorkoutDb } from "@/features/workout-form/server/workouts.db";
import {
	buildWorkoutEditForm,
	requireWorkout,
} from "@/features/workout-view/server/workout-view.functions";

export const getWorkoutById = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const db = yield* WorkoutDb;
		const workout = yield* db.getWorkoutForEdit({ workoutId, userId });
		const requiredWorkout = yield* requireWorkout(workout);

		return buildWorkoutEditForm(requiredWorkout);
	});
