import "server-only";

import { Effect } from "effect";
import { WorkoutViewDb } from "@/features/workout-view/server/workout-view.db";
import {
	buildWorkoutEditForm,
	requireWorkout,
} from "@/features/workout-view/server/workout-view.functions";

export const getWorkoutById = (workoutId: string, userId: string) =>
	Effect.gen(function* () {
		const db = yield* WorkoutViewDb;
		const workout = yield* db.getWorkout({ workoutId, userId });
		const requiredWorkout = yield* requireWorkout(workout);

		return buildWorkoutEditForm(requiredWorkout);
	});
