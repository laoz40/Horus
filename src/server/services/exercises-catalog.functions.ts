import "server-only";

import { err, ok } from "neverthrow";

import { normalizeName } from "@/lib/normalizeName";
import type { UserExerciseCatalogRow } from "@/server/services/exercises-catalog.db";

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

export function requireUserExercise(exercise: UserExerciseCatalogRow | null) {
	if (exercise === null) {
		return err({ reason: "EXERCISE_NOT_FOUND" as const });
	}

	return ok(exercise);
}

export function requireUnusedExercise(exercise: UserExerciseCatalogRow) {
	if (exercise.workoutCount > 0) {
		return err({ reason: "EXERCISE_IN_USE" as const });
	}

	return ok(exercise);
}
