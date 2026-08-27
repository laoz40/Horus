import "server-only";

import { getYearInTrainingRows, type YearInTrainingQuery } from "@/server/services/dashboard.db";

export function getYearInTraining(query: YearInTrainingQuery) {
	return getYearInTrainingRows(query);
}
