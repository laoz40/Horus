import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { db, type DatabaseTransaction } from "@/lib/db";
import {
	exerciseMuscleGroups,
	exercises,
	muscleGroups,
	workoutExercises,
	workouts,
	workoutSets,
} from "@/lib/db/schema";
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

export interface ExercisePrRow {
	hasHistory: boolean;
	highestWeight: number;
	highestVolume: number;
	highestBodyweightReps: number;
}

export function searchExerciseRows(userId: string, normalizedQuery: string) {
	return tryPromise({
		try: () =>
			db
				.select({
					id: exercises.id,
					name: exercises.name,
					normalizedName: exercises.normalizedName,
					muscleGroups: sql<string[]>`coalesce(
						array_agg(${muscleGroups.name} order by ${muscleGroups.name})
							filter (where ${muscleGroups.name} is not null),
						array[]::text[]
					)`,
				})
				.from(exercises)
				.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
				.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
				.where(
					sql`${exercises.userId} = ${userId} and position(${normalizedQuery} in ${exercises.normalizedName}) > 0`,
				)
				.groupBy(exercises.id)
				.orderBy(asc(exercises.name))
				.limit(10),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getExercisePrRows(userId: string, normalizedExerciseName: string) {
	return tryPromise({
		try: (): Promise<ExercisePrRow[]> =>
			db
				.select({
					hasHistory: sql<boolean>`count(*) > 0`,
					highestWeight: sql<number>`coalesce(
						max(${workoutSets.weight}) filter (where ${workoutSets.weight} > 0),
						0
					)::double precision`,
					highestVolume: sql<number>`coalesce(
						max(${workoutSets.weight} * ${workoutSets.reps}) filter (
							where ${workoutSets.weight} > 0
						),
						0
					)::double precision`,
					highestBodyweightReps: sql<number>`coalesce(
						max(${workoutSets.reps}) filter (where ${workoutSets.weight} = 0),
						0
					)::double precision`,
				})
				.from(workoutSets)
				.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
				.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
				.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
				.where(
					and(
						eq(workouts.userId, userId),
						eq(exercises.userId, userId),
						eq(exercises.normalizedName, normalizedExerciseName),
						eq(workoutSets.completed, true),
					),
				),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getRecentSetRows(userId: string, normalizedExerciseName: string) {
	// Materialize the matching history once so each small top-N query reuses it.
	const matchingSets = db.$with("matching_completed_sets").as(
		db
			.select({
				id: sql<string>`${workoutSets.id}`.as("set_id"),
				weight: sql<number>`${workoutSets.weight}`.mapWith(workoutSets.weight).as("set_weight"),
				reps: sql<number>`${workoutSets.reps}`.mapWith(workoutSets.reps).as("set_reps"),
				completedAtMs: sql<number>`(
				extract(epoch from ${workouts.createdAt}) * 1000
			)::double precision`.as("completed_at_ms"),
				workoutId: sql<string>`${workouts.id}`.as("workout_id"),
				exercisePosition: sql<number>`${workoutExercises.position}`.as("exercise_position"),
				setPosition: sql<number>`${workoutSets.position}`.as("set_position"),
			})
			.from(workoutSets)
			.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
			.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
			.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
			.where(
				and(
					eq(workouts.userId, userId),
					eq(exercises.userId, userId),
					eq(exercises.normalizedName, normalizedExerciseName),
					eq(workoutSets.completed, true),
				),
			),
	);

	const recentSets = db
		.$with("recent_sets")
		.as(
			db
				.select()
				.from(matchingSets)
				.orderBy(
					desc(matchingSets.completedAtMs),
					desc(matchingSets.workoutId),
					desc(matchingSets.exercisePosition),
					desc(matchingSets.setPosition),
				)
				.limit(6),
		);

	// Select exact set IDs so equal records keep the earliest record holder.
	const weightPr = db.$with("weight_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("weight_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} > 0`)
			.orderBy(
				desc(matchingSets.weight),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	const volumePr = db.$with("volume_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("volume_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} * ${matchingSets.reps} > 0`)
			.orderBy(
				desc(sql`${matchingSets.weight} * ${matchingSets.reps}`),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	const bodyweightRepsPr = db.$with("bodyweight_reps_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("bodyweight_reps_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} = 0 and ${matchingSets.reps} > 0`)
			.orderBy(
				desc(matchingSets.reps),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	return tryPromise({
		try: (): Promise<RecentSetRow[]> =>
			db
				.with(matchingSets, recentSets, weightPr, volumePr, bodyweightRepsPr)
				.select({
					id: recentSets.id,
					weight: recentSets.weight,
					reps: recentSets.reps,
					completedAtMs: recentSets.completedAtMs,
					isWeightPr: sql<boolean>`coalesce(${recentSets.id} = ${weightPr.id}, false)`,
					isVolumePr: sql<boolean>`coalesce(${recentSets.id} = ${volumePr.id}, false)`,
					isBodyweightRepsPr: sql<boolean>`coalesce(${recentSets.id} = ${bodyweightRepsPr.id}, false)`,
				})
				.from(recentSets)
				.leftJoin(weightPr, sql`true`)
				.leftJoin(volumePr, sql`true`)
				.leftJoin(bodyweightRepsPr, sql`true`)
				.orderBy(
					desc(recentSets.completedAtMs),
					desc(recentSets.workoutId),
					desc(recentSets.exercisePosition),
					desc(recentSets.setPosition),
				),
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
