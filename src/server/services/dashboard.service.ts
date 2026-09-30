import "server-only";

import {
	getTrainingYearRangeRows,
	getYearInTrainingRows,
	type YearInTrainingQuery,
} from "@/server/services/dashboard.db";

export function getYearInTraining(query: YearInTrainingQuery) {
	return getYearInTrainingRows(query);
}

export function getTrainingYearRange(userId: string) {
	return getTrainingYearRangeRows(userId);
}
