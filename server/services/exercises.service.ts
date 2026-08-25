import "server-only";

import { normalizeName } from "@/lib/normalizeName";
import { getRecentSetRows, searchExerciseRows } from "@/server/services/exercises.db";
import { buildRecentSets } from "@/server/services/exercises.functions";

export function searchExercises(userId: string, query: string) {
	const normalizedQuery = normalizeName(query);

	return searchExerciseRows(userId, normalizedQuery);
}

export function getRecentSets(userId: string, exerciseName: string) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getRecentSetRows(userId, normalizedExerciseName).map(buildRecentSets);
}
