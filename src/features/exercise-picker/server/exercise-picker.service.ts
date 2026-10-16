import "server-only";

import { Effect } from "effect";
import {
	getNormalizedMuscleNamesForCategory,
	type MuscleGroupCategory,
} from "@/features/exercise-library/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";
import { ExerciseDb } from "@/features/exercise-library/server/exercises.db";

export const searchExercises = (userId: string, query: string) =>
	Effect.gen(function* () {
		const normalizedQuery = normalizeName(query);
		const db = yield* ExerciseDb;

		return yield* db.searchExercises({ userId, normalizedQuery });
	});

export const listExercisesByCategory = (userId: string, category: MuscleGroupCategory) =>
	Effect.gen(function* () {
		const normalizedMuscleNames = getNormalizedMuscleNamesForCategory(category);
		const db = yield* ExerciseDb;

		return yield* db.listByCategory({ userId, normalizedMuscleNames });
	});
