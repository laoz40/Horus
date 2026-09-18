import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import {
	getAffectedPrHistorySets as getAffectedPrHistorySetsQuery,
	getExercisePrByIds,
	getExercisePrByIdsBeforeCutoff,
	updateSetPrStatuses as updateSetPrStatusesQuery,
	updateWorkoutPrTotals as updateWorkoutPrTotalsQuery,
	updateWorkoutPrTotalsByIds as updateWorkoutPrTotalsByIdsQuery,
} from "@/generated/prisma/sql";
import { type DatabaseTransaction } from "@/lib/db";
import { type PrHistoryCutoff, type PrSetUpdate } from "@/server/services/pr-history.functions";

type Tx = DatabaseTransaction;

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

export async function getExercisePrRowsByIds(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
	cutoff?: PrHistoryCutoff,
) {
	const rows = cutoff
		? await tx.$queryRawTyped(
				getExercisePrByIdsBeforeCutoff(userId, exerciseIds, cutoff.createdAt, cutoff.workoutId),
			)
		: await tx.$queryRawTyped(getExercisePrByIds(userId, exerciseIds));

	return rows.map((row) => ({
		exerciseId: row.exercise_id,
		hasHistory: row.has_history ?? false,
		highestWeight: row.highest_weight ?? 0,
		highestVolume: row.highest_volume ?? 0,
		highestBodyweightReps: row.highest_bodyweight_reps ?? 0,
	}));
}

export async function getAffectedPrHistorySets(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
	cutoff: PrHistoryCutoff,
) {
	const rows = await tx.$queryRawTyped(
		getAffectedPrHistorySetsQuery(userId, exerciseIds, cutoff.createdAt, cutoff.workoutId),
	);

	return rows.map((row) => ({
		setId: row.set_id,
		workoutId: row.workout_id,
		exerciseId: row.exercise_id,
		weight: decimalToNumber(row.weight),
		reps: decimalToNumber(row.reps),
		completed: row.completed,
	}));
}

const SET_PR_STATUSES_CHUNK_SIZE = 4000;

export async function updateSetPrStatuses(tx: Tx, prStatuses: PrSetUpdate[]): Promise<void> {
	if (prStatuses.length === 0) {
		return;
	}

	// Send calculated statuses in bounded chunks so Neon/PostgreSQL does not exceed its 65,535 parameter limit.
	// Chunks touch disjoint rows and are submitted in order, so pipelining them is safe.
	const chunks: PrSetUpdate[][] = [];

	for (let i = 0; i < prStatuses.length; i += SET_PR_STATUSES_CHUNK_SIZE) {
		chunks.push(prStatuses.slice(i, i + SET_PR_STATUSES_CHUNK_SIZE));
	}

	await Promise.all(
		chunks.map((chunk) => {
			const query = updateSetPrStatusesQuery(
				chunk.map((status) => status.setId),
				chunk.map((status) => status.isWeightPr),
				chunk.map((status) => status.isVolumePr),
				chunk.map((status) => status.isBodyweightRepsPr),
			);

			return tx.$executeRawUnsafe(query.sql, ...query.values);
		}),
	);
}

export async function updateWorkoutPrTotals(
	tx: Tx,
	userId: string,
	workoutIds?: string[],
): Promise<void> {
	if (workoutIds?.length === 0) {
		return;
	}

	const query = workoutIds
		? updateWorkoutPrTotalsByIdsQuery(userId, workoutIds)
		: updateWorkoutPrTotalsQuery(userId);

	await tx.$executeRawUnsafe(query.sql, ...query.values);
}
