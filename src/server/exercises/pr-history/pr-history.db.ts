import "server-only";

import { Context, Effect, Layer } from "effect";
import {
	getAffectedPrHistorySets,
	getExercisePrByIds,
	getExercisePrByIdsBeforeCutoff,
	updateSetPrStatuses,
	updateWorkoutPrTotalsByIds,
} from "@/generated/prisma/sql";
import { DbConnection } from "@/lib/db/connection";
import { DatabaseError } from "@/lib/db/database";
import type {
	ExercisePrRow,
	PrHistoryCutoff,
	PrHistorySet,
	PrSetUpdate,
} from "@/server/exercises/pr-history/pr-history.functions";

type HistoryQuery = {
	userId: string;
	exerciseIds: string[];
	cutoff: PrHistoryCutoff;
};

const SET_PR_STATUSES_CHUNK_SIZE = 4000;

export class PrHistoryDb extends Context.Service<
	PrHistoryDb,
	{
		readonly getPreviousPrs: (
			query: Omit<HistoryQuery, "cutoff"> & { cutoff?: PrHistoryCutoff },
		) => Effect.Effect<ExercisePrRow[], DatabaseError>;
		readonly getAffectedSets: (query: HistoryQuery) => Effect.Effect<PrHistorySet[], DatabaseError>;
		readonly updateSetStatuses: (statuses: PrSetUpdate[]) => Effect.Effect<void, DatabaseError>;
		readonly updateWorkoutTotals: (query: {
			userId: string;
			workoutIds: string[];
		}) => Effect.Effect<void, DatabaseError>;
	}
>()("horus/PrHistoryDb") {}

export const prHistoryDb = Layer.effect(
	PrHistoryDb,
	Effect.gen(function* () {
		const connection = yield* DbConnection;

		return {
			getPreviousPrs: ({ userId, exerciseIds, cutoff }) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () =>
							connection.$queryRawTyped(
								cutoff
									? getExercisePrByIdsBeforeCutoff(
											userId,
											exerciseIds,
											cutoff.createdAt,
											cutoff.workoutId,
										)
									: getExercisePrByIds(userId, exerciseIds),
							),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map((row) => ({
						exerciseId: row.exercise_id,
						hasHistory: row.has_history ?? false,
						highestWeight: row.highest_weight ?? 0,
						highestVolume: row.highest_volume ?? 0,
						highestBodyweightReps: row.highest_bodyweight_reps ?? 0,
					}));
				}),
			getAffectedSets: ({ userId, exerciseIds, cutoff }) =>
				Effect.gen(function* () {
					const rows = yield* Effect.tryPromise({
						try: () =>
							connection.$queryRawTyped(
								getAffectedPrHistorySets(userId, exerciseIds, cutoff.createdAt, cutoff.workoutId),
							),
						catch: (cause) => new DatabaseError({ cause }),
					});

					return rows.map((row) => ({
						setId: row.set_id,
						workoutId: row.workout_id,
						exerciseId: row.exercise_id,
						weight: row.weight.toNumber(),
						reps: row.reps.toNumber(),
						completed: row.completed,
					}));
				}),
			updateSetStatuses: (statuses) =>
				Effect.gen(function* () {
					// Send calculated statuses in bounded chunks so Neon/PostgreSQL does not exceed its 65,535 parameter limit.
					// Chunks touch disjoint rows and are submitted in order, so pipelining them is safe.
					const chunks: PrSetUpdate[][] = [];

					for (let i = 0; i < statuses.length; i += SET_PR_STATUSES_CHUNK_SIZE) {
						chunks.push(statuses.slice(i, i + SET_PR_STATUSES_CHUNK_SIZE));
					}

					yield* Effect.forEach(
						chunks,
						(chunk) =>
							Effect.tryPromise({
								try: () =>
									connection.$queryRawTyped(
										updateSetPrStatuses(
											chunk.map((status) => status.setId),
											chunk.map((status) => status.isWeightPr),
											chunk.map((status) => status.isVolumePr),
											chunk.map((status) => status.isBodyweightRepsPr),
										),
									),
								catch: (cause) => new DatabaseError({ cause }),
							}),
						{ concurrency: "unbounded", discard: true },
					);
				}),
			updateWorkoutTotals: ({ userId, workoutIds }) =>
				Effect.gen(function* () {
					if (workoutIds.length === 0) {
						return;
					}

					yield* Effect.tryPromise({
						try: () => connection.$queryRawTyped(updateWorkoutPrTotalsByIds(userId, workoutIds)),
						catch: (cause) => new DatabaseError({ cause }),
					});
				}),
		} satisfies PrHistoryDb["Service"];
	}),
);
