import "server-only";

import { normalizeName } from "@/lib/normalizeName";
import { searchExerciseRows } from "@/server/services/exercises.db";

export function searchExercises(userId: string, query: string) {
	const normalizedQuery = normalizeName(query);

	return searchExerciseRows(userId, normalizedQuery);
}
