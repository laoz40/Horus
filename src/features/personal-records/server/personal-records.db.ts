import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import { Context, Effect, Layer } from "effect";
import {
	getExercisePersonalRecords as getExercisePersonalRecordsSql,
	getExercisePr as getExercisePrSql,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DatabaseError } from "@/lib/db/database";

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

export class PersonalRecordsDb extends Context.Service<
	PersonalRecordsDb,
	{
		readonly getExercisePr: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<
			Array<{
				hasHistory: boolean;
				highestWeight: number;
				highestVolume: number;
				highestBodyweightReps: number;
			}>,
			DatabaseError
		>;
		readonly getExercisePersonalRecords: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<ExercisePersonalRecordsRow[], DatabaseError>;
	}
>()("horus/PersonalRecordsDb") {}

export const personalRecordsDb = Layer.succeed(PersonalRecordsDb, {
	getExercisePr: ({ userId, normalizedExerciseName }) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () => prisma.$queryRawTyped(getExercisePrSql(userId, normalizedExerciseName)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return rows.map((row) => ({
				hasHistory: row.has_history ?? false,
				highestWeight: row.highest_weight ?? 0,
				highestVolume: row.highest_volume ?? 0,
				highestBodyweightReps: row.highest_bodyweight_reps ?? 0,
			}));
		}),
	getExercisePersonalRecords: ({ userId, normalizedExerciseName }) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () =>
					prisma.$queryRawTyped(getExercisePersonalRecordsSql(userId, normalizedExerciseName)),
				catch: (cause) => new DatabaseError({ cause }),
			});

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
		}),
});
