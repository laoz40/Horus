import "server-only";

import { Effect } from "effect";
import { normalizeName } from "@/lib/normalizeName";
import {
	EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
	exerciseWeightProgressionSince,
	type ExerciseWeightProgressionRange,
} from "@/features/progress/lib/exerciseWeightProgression";
import {
	getExercisePersonalRecordRows,
	getExercisePrRows,
	getExerciseWeeklyWeightProgressionRows,
	getRecentSetRows,
} from "@/server/exercises/progress/progress.repository";
import {
	buildExercisePersonalRecords,
	buildRecentSets,
	buildWeeklyWeightProgression,
	checkCompletedSetPr,
} from "@/server/exercises/progress/progress.functions";
import { emptyExercisePrs } from "@/server/exercises/pr-history/pr-history.functions";

export const getRecentSets = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const normalizedExerciseName = normalizeName(exerciseName);

		return buildRecentSets(yield* getRecentSetRows(userId, normalizedExerciseName));
	});

export const getExercisePersonalRecords = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* getExercisePersonalRecordRows(userId, normalizedExerciseName);

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
		const normalizedExerciseName = normalizeName(exerciseName);
		const sinceCreatedAt = exerciseWeightProgressionSince(range);

		const rows = yield* getExerciseWeeklyWeightProgressionRows(
			userId,
			normalizedExerciseName,
			sinceCreatedAt,
			EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
		);

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
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* getExercisePrRows(userId, normalizedExerciseName);

		return checkCompletedSetPr(sets, setIndex, rows[0] ?? emptyExercisePrs());
	});
