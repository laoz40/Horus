import "server-only";

import { Effect } from "effect";
import { normalizeName } from "@/lib/normalizeName";
import {
	EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
	exerciseWeightProgressionSince,
	type ExerciseWeightProgressionRange,
} from "@/features/exercise-progress/lib/exerciseWeightProgression";
import { ProgressDb } from "@/features/exercise-progress/server/exercise-progress.db";
import {
	buildRecentSets,
	buildWeeklyWeightProgression,
} from "@/features/exercise-progress/server/exercise-progress.functions";

export const getRecentSets = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const db = yield* ProgressDb;
		const normalizedExerciseName = normalizeName(exerciseName);

		return buildRecentSets(yield* db.getRecentSets({ userId, normalizedExerciseName }));
	});

export const getExerciseWeeklyWeightProgression = (
	userId: string,
	exerciseName: string,
	range: ExerciseWeightProgressionRange,
) =>
	Effect.gen(function* () {
		const db = yield* ProgressDb;
		const normalizedExerciseName = normalizeName(exerciseName);
		const sinceCreatedAt = exerciseWeightProgressionSince(range);

		const rows = yield* db.getExerciseWeeklyWeightProgression({
			userId,
			normalizedExerciseName,
			sinceCreatedAt,
			minReps: EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
		});

		return buildWeeklyWeightProgression(rows);
	});
