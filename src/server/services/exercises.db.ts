import "server-only";

import type { Decimal } from "@prisma/client/runtime/client";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import {
	getExercisePersonalRecords,
	getExercisePr,
	getExerciseWeeklyWeightProgression,
	getRecentSets,
	listExercisesByCategory,
	searchExercises,
} from "@/generated/prisma/sql";
import { prisma, type DatabaseTransaction } from "@/lib/db";
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
				getExerciseWeeklyWeightProgression(
					userId,
					normalizedExerciseName,
					sinceCreatedAt,
					minReps,
				),
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

async function findSubmittedExerciseId(
	tx: Tx,
	userId: string,
	exerciseId: string,
	normalizedName: string,
) {
	const exercise = await tx.exercises.findFirst({
		where: {
			id: exerciseId,
			user_id: userId,
			normalized_name: normalizedName,
		},
		select: { id: true },
	});

	return exercise?.id;
}

async function findExerciseIdByNormalizedName(tx: Tx, userId: string, normalizedName: string) {
	const exercise = await tx.exercises.findFirst({
		where: {
			user_id: userId,
			normalized_name: normalizedName,
		},
		select: { id: true },
	});

	return exercise?.id;
}

async function getOrCreateMuscleGroupId(
	tx: Tx,
	muscleGroup: { name: string; normalizedName: string },
): Promise<string> {
	const row = await tx.muscle_groups.upsert({
		where: { normalized_name: muscleGroup.normalizedName },
		create: {
			name: muscleGroup.name,
			normalized_name: muscleGroup.normalizedName,
		},
		update: {},
		select: { id: true },
	});

	return row.id;
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

	await tx.exercise_muscle_groups.createMany({
		data: muscleGroupIds.map((muscleGroupId) => ({
			exercise_id: exerciseId,
			muscle_group_id: muscleGroupId,
		})),
		skipDuplicates: true,
	});
}

async function createOrGetExercise(
	tx: Tx,
	userId: string,
	exercise: PreparedWorkoutWriteExercise,
): Promise<string> {
	const createResult = await tx.exercises.createMany({
		data: [
			{
				user_id: userId,
				name: exercise.global.name,
				normalized_name: exercise.global.normalizedName,
			},
		],
		skipDuplicates: true,
	});

	const exerciseId = await findExerciseIdByNormalizedName(
		tx,
		userId,
		exercise.global.normalizedName,
	);

	if (!exerciseId) {
		throw new Error("Exercise conflict did not resolve to an existing row");
	}

	if (createResult.count > 0) {
		await insertExerciseMuscleGroups(tx, exerciseId, exercise.global.muscleGroups);
	}

	return exerciseId;
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
