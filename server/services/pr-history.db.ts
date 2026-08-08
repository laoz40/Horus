import "server-only";

import { Pool } from "@neondatabase/serverless";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/env";
import { workouts, workoutExercises, workoutSets } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";
import {
	buildPrTotalsByWorkoutId,
	calculatePrHistory,
	type PrSetUpdate,
	summarizePrHistory,
} from "@/server/services/pr-history.functions";

type TransactionDatabase = ReturnType<typeof drizzle>;
type Tx = Parameters<Parameters<TransactionDatabase["transaction"]>[0]>[0];

async function getWorkoutCount(tx: Tx, userId: string): Promise<number> {
	const workoutRows = await tx
		.select({ id: workouts.id })
		.from(workouts)
		.where(eq(workouts.userId, userId));

	return workoutRows.length;
}

function getPrHistorySets(tx: Tx, userId: string) {
	return tx
		.select({
			setId: workoutSets.id,
			workoutId: workouts.id,
			exerciseId: workoutExercises.exerciseId,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			completed: workoutSets.completed,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
		.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
		.where(eq(workouts.userId, userId))
		.orderBy(
			asc(workouts.createdAt),
			asc(workouts.id),
			asc(workoutExercises.position),
			asc(workoutSets.position),
		);
}

async function updateSetPrStatuses(tx: Tx, prStatuses: PrSetUpdate[]): Promise<void> {
	for (const status of prStatuses) {
		await tx
			.update(workoutSets)
			.set({
				isWeightPr: status.isWeightPr,
				isVolumePr: status.isVolumePr,
				isBodyweightRepsPr: status.isBodyweightRepsPr,
			})
			.where(eq(workoutSets.id, status.setId));
	}
}

async function resetWorkoutPrTotals(tx: Tx, userId: string): Promise<void> {
	await tx.update(workouts).set({ totalPrSets: 0 }).where(eq(workouts.userId, userId));
}

async function updateWorkoutPrTotals(
	tx: Tx,
	totalsByWorkoutId: Map<string, number>,
): Promise<void> {
	for (const [workoutId, totalPrSets] of totalsByWorkoutId) {
		await tx.update(workouts).set({ totalPrSets }).where(eq(workouts.id, workoutId));
	}
}

export function rebuildPrHistoryTx(userId: string) {
	const pool = new Pool({ connectionString: env.DATABASE_URL });
	const transactionDatabase = drizzle({ client: pool });

	return tryPromise({
		try: () =>
			transactionDatabase
				.transaction(async (tx) => {
					const workoutCount = await getWorkoutCount(tx, userId);
					const historySets = await getPrHistorySets(tx, userId);
					const prStatuses = calculatePrHistory(historySets);
					const totalsByWorkoutId = buildPrTotalsByWorkoutId(prStatuses);

					await updateSetPrStatuses(tx, prStatuses);
					await resetWorkoutPrTotals(tx, userId);
					await updateWorkoutPrTotals(tx, totalsByWorkoutId);

					return summarizePrHistory(workoutCount, prStatuses, totalsByWorkoutId);
				})
				.finally(() => pool.end()),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
