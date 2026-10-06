import "server-only";

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

export function getRecentSets(userId: string, exerciseName: string) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getRecentSetRows(userId, normalizedExerciseName).map(buildRecentSets);
}

export function getExercisePersonalRecords(userId: string, exerciseName: string) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getExercisePersonalRecordRows(userId, normalizedExerciseName).map((rows) =>
		buildExercisePersonalRecords(
			rows[0] ?? {
				hasHistory: false,
				weight: null,
				volume: null,
				bodyweightReps: null,
			},
		),
	);
}

export function getExerciseWeeklyWeightProgression(
	userId: string,
	exerciseName: string,
	range: ExerciseWeightProgressionRange,
) {
	const normalizedExerciseName = normalizeName(exerciseName);
	const sinceCreatedAt = exerciseWeightProgressionSince(range);

	return getExerciseWeeklyWeightProgressionRows(
		userId,
		normalizedExerciseName,
		sinceCreatedAt,
		EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
	).map(buildWeeklyWeightProgression);
}

interface CheckSetPrInput {
	userId: string;
	exerciseName: string;
	sets: { completed: boolean; weight?: number; reps?: number }[];
	setIndex: number;
}

export function checkSetPr({ userId, exerciseName, sets, setIndex }: CheckSetPrInput) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getExercisePrRows(userId, normalizedExerciseName).map((rows) =>
		checkCompletedSetPr(sets, setIndex, rows[0] ?? emptyExercisePrs()),
	);
}
