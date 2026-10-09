import "server-only";

import { Effect } from "effect";
import { normalizeName } from "@/lib/normalizeName";
import {
	EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
	exerciseWeightProgressionSince,
	type ExerciseWeightProgressionRange,
} from "@/features/progress/lib/exerciseWeightProgression";
import { ProgressDb } from "@/server/exercises/progress/progress.db";
import {
	buildExercisePersonalRecords,
	buildRecentSets,
	buildWeeklyWeightProgression,
	checkCompletedSetPr,
} from "@/server/exercises/progress/progress.functions";
import { emptyExercisePrs } from "@/server/exercises/pr-history/pr-history.functions";

export const getRecentSets = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const db = yield* ProgressDb;
		const normalizedExerciseName = normalizeName(exerciseName);

		return buildRecentSets(yield* db.getRecentSets({ userId, normalizedExerciseName }));
	});

export const getExercisePersonalRecords = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const db = yield* ProgressDb;
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* db.getExercisePersonalRecords({ userId, normalizedExerciseName });

		return buildExercisePersonalRecords(
			rows[0] ?? {
				hasHistory: false,
				weight: null,
				volume: null,
				bodyweightReps: null,
			},
		);
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

interface CheckSetPrInput {
	userId: string;
	exerciseName: string;
	sets: { completed: boolean; weight?: number; reps?: number }[];
	setIndex: number;
}

export const checkSetPr = ({ userId, exerciseName, sets, setIndex }: CheckSetPrInput) =>
	Effect.gen(function* () {
		const db = yield* ProgressDb;
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* db.getExercisePr({ userId, normalizedExerciseName });

		return checkCompletedSetPr(sets, setIndex, rows[0] ?? emptyExercisePrs());
	});
