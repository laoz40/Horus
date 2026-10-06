import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import {
	getExercisePersonalRecords,
	getExercisePr,
	getExerciseWeeklyWeightProgression,
	getRecentSets,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";

export interface RecentSetRow {
	id: string;
	weight: number;
	reps: number;
	completedAtMs: number;
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}

interface ExercisePrRow {
	hasHistory: boolean;
	highestWeight: number;
	highestVolume: number;
	highestBodyweightReps: number;
}

export interface ExercisePersonalRecordsRow {
	hasHistory: boolean;
	weight: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
	volume: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
	bodyweightReps: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
	} | null;
}

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

export function getExercisePrRows(userId: string, normalizedExerciseName: string) {
	return tryPromise({
		try: async (): Promise<ExercisePrRow[]> => {
			const rows = await prisma.$queryRawTyped(getExercisePr(userId, normalizedExerciseName));

			return rows.map((row) => ({
				hasHistory: row.has_history ?? false,
				highestWeight: row.highest_weight ?? 0,
				highestVolume: row.highest_volume ?? 0,
				highestBodyweightReps: row.highest_bodyweight_reps ?? 0,
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

function mapPersonalRecordSet(
	id: string | null | undefined,
	weight: Decimal | null | undefined,
	reps: Decimal | null | undefined,
	completedAtMs: number | null | undefined,
): ExercisePersonalRecordsRow["weight"] {
	if (!id || weight === null || weight === undefined || reps === null || reps === undefined) {
		return null;
	}

	return {
		id,
		weight: decimalToNumber(weight),
		reps: decimalToNumber(reps),
		completedAtMs: completedAtMs ?? 0,
	};
}

export function getExercisePersonalRecordRows(userId: string, normalizedExerciseName: string) {
	return tryPromise({
		try: async (): Promise<ExercisePersonalRecordsRow[]> => {
			const rows = await prisma.$queryRawTyped(
				getExercisePersonalRecords(userId, normalizedExerciseName),
			);

			return rows.map((row) => ({
				hasHistory: row.has_history ?? false,
				weight: mapPersonalRecordSet(
					row.weight_id,
					row.weight_weight,
					row.weight_reps,
					row.weight_completed_at_ms,
				),
				volume: mapPersonalRecordSet(
					row.volume_id,
					row.volume_weight,
					row.volume_reps,
					row.volume_completed_at_ms,
				),
				bodyweightReps: mapPersonalRecordSet(
					row.bodyweight_reps_id,
					row.bodyweight_reps_weight,
					row.bodyweight_reps_reps,
					row.bodyweight_reps_completed_at_ms,
				),
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export interface WeeklyWeightProgressionRow {
	weekStartMs: number;
	maxWeight: number;
}

export function getExerciseWeeklyWeightProgressionRows(
	userId: string,
	normalizedExerciseName: string,
	sinceCreatedAt: Date,
	minReps: number,
) {
	return tryPromise({
		try: async (): Promise<WeeklyWeightProgressionRow[]> => {
			const rows = await prisma.$queryRawTyped(
				getExerciseWeeklyWeightProgression(userId, normalizedExerciseName, sinceCreatedAt, minReps),
			);

			return rows.map((row) => ({
				weekStartMs: row.week_start?.getTime() ?? 0,
				maxWeight: row.max_weight ?? 0,
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getRecentSetRows(userId: string, normalizedExerciseName: string) {
	return tryPromise({
		try: async (): Promise<RecentSetRow[]> => {
			const rows = await prisma.$queryRawTyped(getRecentSets(userId, normalizedExerciseName));

			return rows.map((row) => ({
				id: row.id,
				weight: decimalToNumber(row.weight),
				reps: decimalToNumber(row.reps),
				completedAtMs: row.completed_at_ms ?? 0,
				isWeightPr: row.is_weight_pr ?? false,
				isVolumePr: row.is_volume_pr ?? false,
				isBodyweightRepsPr: row.is_bodyweight_reps_pr ?? false,
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
