import "server-only";

import {
	getNormalizedMuscleNamesForCategory,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";
import {
	getExercisePrRows,
	getRecentSetRows,
	listExerciseRowsByCategory,
	searchExerciseRows,
} from "@/server/services/exercises.db";
import { buildRecentSets, checkCompletedSetPr } from "@/server/services/exercises.functions";
import { emptyExercisePrs } from "@/server/services/pr-history.functions";

export function searchExercises(userId: string, query: string) {
	const normalizedQuery = normalizeName(query);

	return searchExerciseRows(userId, normalizedQuery);
}

export function listExercisesByCategory(userId: string, category: MuscleGroupCategory) {
	const normalizedMuscleNames = getNormalizedMuscleNamesForCategory(category);

	return listExerciseRowsByCategory(userId, normalizedMuscleNames);
}

export function getRecentSets(userId: string, exerciseName: string) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getRecentSetRows(userId, normalizedExerciseName).map(buildRecentSets);
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
