import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import { Context, Effect, Layer } from "effect";
import {
	getExerciseWeeklyWeightProgression as getExerciseWeeklyWeightProgressionSql,
	getRecentSets as getRecentSetsSql,
} from "@/generated/prisma/sql";
import { prisma } from "@/lib/db";
import { DatabaseError } from "@/lib/db/database";

export interface RecentSetRow {
	id: string;
	weight: number;
	reps: number;
	completedAtMs: number;
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}

export interface WeeklyWeightProgressionRow {
	weekStartMs: number;
	maxWeight: number;
}

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

export class ProgressDb extends Context.Service<
	ProgressDb,
	{
		readonly getExerciseWeeklyWeightProgression: (query: {
			userId: string;
			normalizedExerciseName: string;
			sinceCreatedAt: Date;
			minReps: number;
		}) => Effect.Effect<WeeklyWeightProgressionRow[], DatabaseError>;
		readonly getRecentSets: (query: {
			userId: string;
			normalizedExerciseName: string;
		}) => Effect.Effect<RecentSetRow[], DatabaseError>;
	}
>()("horus/ProgressDb") {}

export const progressDb = Layer.succeed(ProgressDb, {
	getExerciseWeeklyWeightProgression: ({
		userId,
		normalizedExerciseName,
		sinceCreatedAt,
		minReps,
	}) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () =>
					prisma.$queryRawTyped(
						getExerciseWeeklyWeightProgressionSql(
							userId,
							normalizedExerciseName,
							sinceCreatedAt,
							minReps,
						),
					),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return rows.map((row) => ({
				weekStartMs: row.week_start?.getTime() ?? 0,
				maxWeight: row.max_weight ?? 0,
			}));
		}),
	getRecentSets: ({ userId, normalizedExerciseName }) =>
		Effect.gen(function* () {
			const rows = yield* Effect.tryPromise({
				try: () => prisma.$queryRawTyped(getRecentSetsSql(userId, normalizedExerciseName)),
				catch: (cause) => new DatabaseError({ cause }),
			});

			return rows.map((row) => ({
				id: row.id,
				weight: decimalToNumber(row.weight),
				reps: decimalToNumber(row.reps),
				completedAtMs: row.completed_at_ms ?? 0,
				isWeightPr: row.is_weight_pr ?? false,
				isVolumePr: row.is_volume_pr ?? false,
				isBodyweightRepsPr: row.is_bodyweight_reps_pr ?? false,
			}));
		}),
});
