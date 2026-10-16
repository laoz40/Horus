import "server-only";

import { Data, Effect } from "effect";

import type { UserExerciseLibraryRow } from "@/features/exercise-library/server/exercises.db";

export class ExerciseNotFoundError extends Data.TaggedError("ExerciseNotFoundError") {}

class ExerciseInUseError extends Data.TaggedError("ExerciseInUseError") {}

export class ExerciseNameCollisionError extends Data.TaggedError("ExerciseNameCollisionError")<{
	existingExercise: UserExerciseLibraryRow;
}> {}

export function requireUserExercise(exercise: UserExerciseLibraryRow | null) {
	if (exercise === null) {
		return Effect.fail(new ExerciseNotFoundError());
	}

	return Effect.succeed(exercise);
}

export function requireUnusedExercise(exercise: UserExerciseLibraryRow) {
	if (exercise.workoutCount > 0) {
		return Effect.fail(new ExerciseInUseError());
	}

	return Effect.succeed(exercise);
}
