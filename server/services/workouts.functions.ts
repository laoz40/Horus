import "server-only";

import { err, ok } from "neverthrow";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import type { DatabaseTransaction } from "@/lib/db";
import { normalizeName } from "@/lib/normalizeName";
import {
	getAffectedPrHistorySets,
	getExercisePrRows,
	updateSetPrStatuses,
	updateWorkoutPrTotals,
} from "@/server/services/pr-history.db";
import {
	calculateAffectedPrHistory,
	type ExercisePrRow,
	type PrHistoryCutoff,
	type PrHistorySet,
	type PrSetUpdate,
} from "@/server/services/pr-history.functions";
import type { WorkoutExerciseWithDatabaseId } from "@/server/services/exercises.db";
import type {
	ListWorkoutsQuery,
	WorkoutForEdit,
	WorkoutHistoryRow,
} from "@/server/services/workouts.db";

type Tx = DatabaseTransaction;

export function requireWorkout<T>(workout: T | null) {
	if (workout === null) {
		return err({ reason: "NOT_FOUND" as const });
	}

	return ok(workout);
}

export function requireDeletedWorkouts(result: { deletedCount: number }) {
	if (result.deletedCount === 0) {
		return err({ reason: "NO_WORKOUTS" as const });
	}

	return ok(result);
}

function normalizeMuscleGroups(muscleGroups: string[] | undefined) {
	const muscleGroupsByNormalizedName = new Map<string, { name: string; normalizedName: string }>();

	for (const name of muscleGroups ?? []) {
		const normalizedName = normalizeName(name);
		if (normalizedName.length === 0 || muscleGroupsByNormalizedName.has(normalizedName)) {
			continue;
		}

		muscleGroupsByNormalizedName.set(normalizedName, {
			name: name.trim(),
			normalizedName,
		});
	}

	return [...muscleGroupsByNormalizedName.values()];
}

export function validateUniqueWorkoutChildIds(workout: WorkoutForSave) {
	const workoutExerciseIds = workout.exercises.map((exercise) => exercise.id);
	const setIds = workout.exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));
	const hasDuplicateWorkoutExerciseId =
		new Set(workoutExerciseIds).size !== workoutExerciseIds.length;
	const hasDuplicateSetId = new Set(setIds).size !== setIds.length;

	if (hasDuplicateWorkoutExerciseId || hasDuplicateSetId) {
		return err({ reason: "INVALID_INPUT" as const });
	}

	return ok(null);
}

export function normalizeWorkoutForWrite(workout: WorkoutForSave) {
	return {
		...workout,
		exercises: workout.exercises.map((exercise) => ({
			...exercise,
			global: {
				name: exercise.global.name,
				normalizedName: normalizeName(exercise.global.name),
				muscleGroups: normalizeMuscleGroups(exercise.global.muscleGroups),
			},
		})),
	};
}

export function buildNewWorkoutPrSets(
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
) {
	return exercisesForWorkout.flatMap((exercise) =>
		exercise.sets.map((set) => ({
			setId: set.id,
			workoutId,
			exerciseId: exercise.exerciseId,
			weight: set.weight,
			reps: set.reps,
			completed: set.completed,
		})),
	);
}

export async function calculateAppendedPrHistory(
	tx: Tx,
	userId: string,
	sets: PrHistorySet[],
): Promise<PrSetUpdate[]> {
	const exerciseIds = [...new Set(sets.map((set) => set.exerciseId))];
	const previousPrRows: ExercisePrRow[] =
		exerciseIds.length === 0 ? [] : await getExercisePrRows(tx, userId, exerciseIds);

	return calculateAffectedPrHistory(sets, previousPrRows).prStatuses;
}

export async function rebuildAffectedPrHistory(
	tx: Tx,
	userId: string,
	exerciseIds: string[],
	cutoff: PrHistoryCutoff,
): Promise<void> {
	if (exerciseIds.length === 0) {
		return;
	}

	const previousPrRows = await getExercisePrRows(tx, userId, exerciseIds, cutoff);
	const historySets = await getAffectedPrHistorySets(tx, userId, exerciseIds, cutoff);
	const { prStatuses, affectedWorkoutIds } = calculateAffectedPrHistory(
		historySets,
		previousPrRows,
	);

	await updateSetPrStatuses(tx, prStatuses);
	// Count all sets in touched workouts because unchanged exercises may also contribute PRs.
	await updateWorkoutPrTotals(tx, userId, affectedWorkoutIds);
}

export function buildWorkoutEditForm(workout: WorkoutForEdit) {
	return {
		name: workout.name,
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			exerciseId: exercise.exerciseId,
			global: {
				name: exercise.name,
				muscleGroups: exercise.muscleGroups,
			},
			difficulty: exercise.difficulty ?? undefined,
			notes: exercise.notes || undefined,
			sets: exercise.sets,
		})),
	};
}

export function buildWorkoutHistoryPage(rows: WorkoutHistoryRow[], query: ListWorkoutsQuery) {
	const pageWorkouts = rows.slice(0, query.limit);

	return {
		items: pageWorkouts.map((workout) => ({
			id: workout.id,
			createdAt: workout.createdAt.getTime(),
			name: workout.name,
			durationSeconds: workout.durationSeconds,
			totalVolume: workout.totalVolume,
			totalPrSets: workout.totalPrSets,
			exerciseCount: workout.exerciseCount,
			muscleGroups: workout.muscleGroups,
		})),
		// If an extra row exists, another page is available.
		nextOffset: rows.length > query.limit ? query.offset + query.limit : null,
	};
}
