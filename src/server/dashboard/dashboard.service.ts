import "server-only";

import {
	getTrainingYearRangeRows,
	getYearInTrainingRows,
	type YearInTrainingQuery,
} from "@/server/dashboard/dashboard.repository";

export function getYearInTraining(query: YearInTrainingQuery) {
	return getYearInTrainingRows(query);
}

export function getTrainingYearRange(userId: string) {
	return getTrainingYearRangeRows(userId);
}
