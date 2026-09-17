import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import { and, eq } from "drizzle-orm";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getExercisePr,
	getRecentSets,
	listExercisesByCategory,
	searchExercises,
} from "@/generated/prisma/sql";
import { prisma, type DatabaseTransaction } from "@/lib/db";
import { exerciseMuscleGroups, exercises, muscleGroups } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

type Tx = DatabaseTransaction;

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

export type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

export type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

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

function decimalToNumber(value: Decimal): number {
	return value.toNumber();
}

export function listExerciseRowsByCategory(userId: string, normalizedMuscleNames: string[]) {
	return tryPromise({
		try: async () => {
			const rows = await prisma.$queryRawTyped(
				listExercisesByCategory(userId, normalizedMuscleNames),
			);

			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				muscleGroups: row.muscle_groups ?? [],
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function searchExerciseRows(userId: string, normalizedQuery: string) {
	return tryPromise({
		try: async () => {
			const rows = await prisma.$queryRawTyped(searchExercises(userId, normalizedQuery));

			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				muscleGroups: row.muscle_groups ?? [],
			}));
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
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

function findSubmittedExerciseId(
	tx: Tx,
	userId: string,
	exerciseId: string,
	normalizedName: string,
) {
	return tx
		.select({ id: exercises.id })
		.from(exercises)
		.where(
			and(
				eq(exercises.id, exerciseId),
				eq(exercises.userId, userId),
				eq(exercises.normalizedName, normalizedName),
			),
		)
		.limit(1)
		.then(([exercise]) => exercise?.id);
}

function findExerciseIdByNormalizedName(tx: Tx, userId: string, normalizedName: string) {
	return tx
		.select({ id: exercises.id })
		.from(exercises)
		.where(and(eq(exercises.userId, userId), eq(exercises.normalizedName, normalizedName)))
		.limit(1)
		.then(([exercise]) => exercise?.id);
}

async function getOrCreateMuscleGroupId(
	tx: Tx,
	muscleGroup: { name: string; normalizedName: string },
): Promise<string> {
	const [createdMuscleGroup] = await tx
		.insert(muscleGroups)
		.values(muscleGroup)
		.onConflictDoNothing()
		.returning({ id: muscleGroups.id });

	if (createdMuscleGroup) {
		return createdMuscleGroup.id;
	}

	const [existingMuscleGroup] = await tx
		.select({ id: muscleGroups.id })
		.from(muscleGroups)
		.where(eq(muscleGroups.normalizedName, muscleGroup.normalizedName))
		.limit(1);

	if (!existingMuscleGroup) {
		throw new Error("Muscle group conflict did not resolve to an existing row");
	}

	return existingMuscleGroup.id;
}

async function insertExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): Promise<void> {
	const muscleGroupIds = await Promise.all(
		muscleGroupsForExercise.map((muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup)),
	);

	if (muscleGroupIds.length === 0) return;

	await tx
		.insert(exerciseMuscleGroups)
		.values(muscleGroupIds.map((muscleGroupId) => ({ exerciseId, muscleGroupId })))
		.onConflictDoNothing();
}

async function createOrGetExercise(
	tx: Tx,
	userId: string,
	exercise: PreparedWorkoutWriteExercise,
): Promise<string> {
	const [createdExercise] = await tx
		.insert(exercises)
		.values({
			userId,
			name: exercise.global.name,
			normalizedName: exercise.global.normalizedName,
		})
		.onConflictDoNothing()
		.returning({ id: exercises.id });

	if (createdExercise) {
		await insertExerciseMuscleGroups(tx, createdExercise.id, exercise.global.muscleGroups);

		return createdExercise.id;
	}

	// The user's normalized exercise name is unique. If the insert conflicted,
	// another matching row already exists, so reuse its UUID instead of creating a duplicate.
	const existingExerciseId = await findExerciseIdByNormalizedName(
		tx,
		userId,
		exercise.global.normalizedName,
	);

	if (!existingExerciseId) {
		throw new Error("Exercise conflict did not resolve to an existing row");
	}

	return existingExerciseId;
}

async function findOrCreateExerciseId(
	tx: Tx,
	userId: string,
	exercise: PreparedWorkoutWriteExercise,
): Promise<string> {
	if (exercise.exerciseId) {
		const submittedExerciseId = await findSubmittedExerciseId(
			tx,
			userId,
			exercise.exerciseId,
			exercise.global.normalizedName,
		);

		if (submittedExerciseId) {
			return submittedExerciseId;
		}
	}

	const existingExerciseId = await findExerciseIdByNormalizedName(
		tx,
		userId,
		exercise.global.normalizedName,
	);

	return existingExerciseId ?? createOrGetExercise(tx, userId, exercise);
}

export async function findOrCreateWorkoutExercises(
	tx: Tx,
	userId: string,
	exercisesForWorkout: PreparedWorkoutWriteExercise[],
): Promise<WorkoutExerciseWithDatabaseId[]> {
	// Duplicates by name still resolve to the same row: createOrGetExercise handles insert conflicts.
	const exercisesWithDatabaseIds = await Promise.all(
		exercisesForWorkout.map(async (exercise) => ({
			...exercise,
			exerciseId: await findOrCreateExerciseId(tx, userId, exercise),
		})),
	);

	return exercisesWithDatabaseIds;
}
