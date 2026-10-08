import "server-only";

import { Data, Effect } from "effect";

import { normalizeName } from "@/lib/normalizeName";
import type { UserExerciseLibraryRow } from "@/server/exercises/library/library.repository";

export function normalizeMuscleGroupsForSave(muscleGroups: string[]) {
	const muscleGroupsByNormalizedName = new Map<string, { name: string; normalizedName: string }>();

	for (const name of muscleGroups) {
		const normalizedName = normalizeName(name);

		if (normalizedName.length === 0 || muscleGroupsByNormalizedName.has(normalizedName)) {
			continue;
		}

		muscleGroupsByNormalizedName.set(normalizedName, {
			name: name.trim(),
			normalizedName,
		});
	}

	return [...muscleGroupsByNormalizedName.values()];
}

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
