import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { type DatabaseTransaction, runDatabaseTransaction } from "@/lib/db";
import { workouts, workoutExercises, workoutSets } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";
import {
	buildPrTotalsByWorkoutId,
	calculatePrHistory,
	type ExercisePrs,
	type PrHistorySet,
	type PrHistoryRebuildSummary,
	type PrSetUpdate,
	summarizePrHistory,
} from "@/server/services/pr-history.functions";

type Tx = DatabaseTransaction;

type ExercisePrRow = ExercisePrs & { exerciseId: string };

function getExercisePrRows(tx: Tx, userId: string, exerciseIds: string[]) {
	return tx
		.select({
			exerciseId: workoutExercises.exerciseId,
			hasHistory: sql<boolean>`count(*) filter (where ${workoutSets.completed}) > 0`,
			highestWeight: sql<number>`coalesce(
				max(${workoutSets.weight}) filter (
					where ${workoutSets.completed} and ${workoutSets.weight} > 0
				),
				0
			)::double precision`,
			highestVolume: sql<number>`coalesce(
				max(${workoutSets.weight} * ${workoutSets.reps}) filter (
					where ${workoutSets.completed} and ${workoutSets.weight} > 0
				),
				0
			)::double precision`,
			highestBodyweightReps: sql<number>`coalesce(
				max(${workoutSets.reps}) filter (
					where ${workoutSets.completed} and ${workoutSets.weight} = 0
				),
				0
			)::double precision`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
		.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
		.where(and(eq(workouts.userId, userId), inArray(workoutExercises.exerciseId, exerciseIds)))
		.groupBy(workoutExercises.exerciseId);
}

export async function calculateAppendedPrHistoryForUserTx(
	tx: Tx,
	userId: string,
	sets: PrHistorySet[],
): Promise<PrSetUpdate[]> {
	const exerciseIds = [...new Set(sets.map((set) => set.exerciseId))];
	const previousPrRows: ExercisePrRow[] =
		exerciseIds.length === 0 ? [] : await getExercisePrRows(tx, userId, exerciseIds);
	const previousPrsByExerciseId = new Map(
		previousPrRows.map(({ exerciseId, ...prs }) => [exerciseId, prs]),
	);

	return calculatePrHistory(sets, previousPrsByExerciseId);
}

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
	if (prStatuses.length === 0) {
		return;
	}

	const calculatedStatuses = sql.join(
		prStatuses.map(
			(status) =>
				sql`(${status.setId}::uuid, ${status.isWeightPr}::boolean, ${status.isVolumePr}::boolean, ${status.isBodyweightRepsPr}::boolean)`,
		),
		sql`, `,
	);

	// Send every calculated status in one statement so Neon does not receive one query per set.
	await tx.execute(sql`
		update ${workoutSets} as workout_sets_to_update
		set
			is_weight_pr = calculated.is_weight_pr,
			is_volume_pr = calculated.is_volume_pr,
			is_bodyweight_reps_pr = calculated.is_bodyweight_reps_pr
		from (
			values ${calculatedStatuses}
		) as calculated(
			set_id,
			is_weight_pr,
			is_volume_pr,
			is_bodyweight_reps_pr
		)
		where workout_sets_to_update.id = calculated.set_id
	`);
}

async function updateWorkoutPrTotals(tx: Tx, userId: string): Promise<void> {
	// Count PR sets for every workout in one statement, including workouts whose new total is zero.
	await tx.execute(sql`
		update ${workouts} as workouts_to_update
		set total_pr_sets = (
			select count(*)::integer
			from ${workoutExercises} as workout_exercises_for_total
			inner join ${workoutSets} as workout_sets_for_total
				on workout_sets_for_total.workout_exercise_id = workout_exercises_for_total.id
			where workout_exercises_for_total.workout_id = workouts_to_update.id
				and (
					workout_sets_for_total.is_weight_pr
					or workout_sets_for_total.is_volume_pr
					or workout_sets_for_total.is_bodyweight_reps_pr
				)
		)
		where workouts_to_update.user_id = ${userId}
	`);
}

export async function rebuildPrHistoryForUserTx(
	tx: Tx,
	userId: string,
): Promise<PrHistoryRebuildSummary> {
	const workoutCount = await getWorkoutCount(tx, userId);
	const historySets = await getPrHistorySets(tx, userId);
	const prStatuses = calculatePrHistory(historySets);
	const totalsByWorkoutId = buildPrTotalsByWorkoutId(prStatuses);

	await updateSetPrStatuses(tx, prStatuses);
	await updateWorkoutPrTotals(tx, userId);

	return summarizePrHistory(workoutCount, prStatuses, totalsByWorkoutId);
}

export function rebuildPrHistoryTx(userId: string) {
	return tryPromise({
		try: () => runDatabaseTransaction((tx) => rebuildPrHistoryForUserTx(tx, userId)),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
