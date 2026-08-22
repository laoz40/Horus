import "server-only";

import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
import type { Result } from "neverthrow";
import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { db, type DatabaseTransaction, runDatabaseTransaction } from "@/lib/db";
import {
	exerciseMuscleGroups,
	exercises,
	muscleGroups,
	workoutExercises,
	workouts,
	workoutSets,
} from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";
import { rebuildPrHistoryForUserTx } from "@/server/services/pr-history.db";

type Tx = DatabaseTransaction;

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

type WorkoutWriteInput = {
	userId: string;
	workout: Omit<WorkoutForSave, "exercises"> & {
		exercises: PreparedWorkoutWriteExercise[];
	};
};

type WorkoutUpdateInput = WorkoutWriteInput & {
	workoutId: string;
};

export type ListWorkoutsQuery = {
	userId: string;
	limit: number;
	offset: number;
};

type RequireWorkoutForUpdate = (workoutExists: boolean) => Result<null, { reason: "NOT_FOUND" }>;

export type WorkoutForEdit = {
	id: string;
	name: string;
	durationSeconds: number | null;
	exercises: Array<{
		id: string;
		exerciseId: string;
		name: string;
		muscleGroups: string[];
		difficulty: number | null;
		notes: string;
		sets: Array<{
			id: string;
			weight: number;
			reps: number;
			completed: boolean;
		}>;
	}>;
};

export type WorkoutHistoryRow = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	totalPrSets: number;
	exerciseCount: number;
	totalVolume: number;
	muscleGroups: string[];
};

function getWorkout(workoutId: string, userId: string) {
	return db
		.select({
			id: workouts.id,
			name: workouts.name,
			durationSeconds: workouts.durationSeconds,
		})
		.from(workouts)
		.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
		.limit(1)
		.then(([workout]) => workout);
}

function getWorkoutExerciseRows(workoutId: string) {
	return db
		.select({
			id: workoutExercises.id,
			exerciseId: exercises.id,
			name: exercises.name,
			muscleGroups: sql<string[]>`coalesce(
				array_agg(${muscleGroups.name} order by ${muscleGroups.name})
					filter (where ${muscleGroups.name} is not null),
				array[]::text[]
			)`,
			difficulty: workoutExercises.difficulty,
			notes: workoutExercises.notes,
			position: workoutExercises.position,
		})
		.from(workoutExercises)
		.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
		.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
		.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
		.where(eq(workoutExercises.workoutId, workoutId))
		.groupBy(workoutExercises.id, exercises.id)
		.orderBy(asc(workoutExercises.position));
}

function getWorkoutSetRows(workoutId: string) {
	return db
		.select({
			id: workoutSets.id,
			workoutExerciseId: workoutSets.workoutExerciseId,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			completed: workoutSets.completed,
			position: workoutSets.position,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
		.where(eq(workoutExercises.workoutId, workoutId))
		.orderBy(asc(workoutSets.position));
}

function getWorkoutForUpdate(tx: Tx, workoutId: string, userId: string) {
	return tx
		.select({ id: workouts.id })
		.from(workouts)
		.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
		.limit(1)
		.for("update")
		.then(([workout]) => workout);
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
	for (const muscleGroup of muscleGroupsForExercise) {
		const muscleGroupId = await getOrCreateMuscleGroupId(tx, muscleGroup);
		await tx
			.insert(exerciseMuscleGroups)
			.values({ exerciseId, muscleGroupId })
			.onConflictDoNothing();
	}
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

async function findOrCreateWorkoutExercises(
	tx: Tx,
	writeInput: WorkoutWriteInput,
): Promise<WorkoutExerciseWithDatabaseId[]> {
	const exerciseIdsByNormalizedName = new Map<string, string>();
	const exercisesWithDatabaseIds: WorkoutExerciseWithDatabaseId[] = [];

	for (const exercise of writeInput.workout.exercises) {
		const normalizedName = exercise.global.normalizedName;
		const cachedExerciseId = exerciseIdsByNormalizedName.get(normalizedName);
		const exerciseId =
			cachedExerciseId ?? (await findOrCreateExerciseId(tx, writeInput.userId, exercise));
		exerciseIdsByNormalizedName.set(normalizedName, exerciseId);
		exercisesWithDatabaseIds.push({ ...exercise, exerciseId });
	}

	return exercisesWithDatabaseIds;
}

async function insertWorkoutRow(tx: Tx, writeInput: WorkoutWriteInput): Promise<string> {
	const [workout] = await tx
		.insert(workouts)
		.values({
			userId: writeInput.userId,
			name: writeInput.workout.name,
			durationSeconds: writeInput.workout.durationSeconds,
		})
		.returning({ id: workouts.id });

	if (!workout) {
		throw new Error("Workout insert did not return a row");
	}

	return workout.id;
}

async function updateWorkoutFields(tx: Tx, updateInput: WorkoutUpdateInput): Promise<void> {
	await tx
		.update(workouts)
		.set({
			name: updateInput.workout.name,
			durationSeconds: updateInput.workout.durationSeconds,
			totalPrSets: 0,
		})
		.where(and(eq(workouts.id, updateInput.workoutId), eq(workouts.userId, updateInput.userId)));
}

async function deleteWorkoutChildren(tx: Tx, workoutId: string): Promise<void> {
	await tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));
}

async function insertWorkoutExerciseRows(
	tx: Tx,
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
): Promise<void> {
	await tx.insert(workoutExercises).values(
		exercisesForWorkout.map((exercise, position) => ({
			id: exercise.id,
			workoutId,
			exerciseId: exercise.exerciseId,
			position,
			difficulty: exercise.difficulty,
			notes: exercise.notes ?? "",
		})),
	);
}

async function insertWorkoutSetRows(
	tx: Tx,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
): Promise<void> {
	await tx.insert(workoutSets).values(
		exercisesForWorkout.flatMap((exercise) =>
			exercise.sets.map((set, position) => ({
				id: set.id,
				workoutExerciseId: exercise.id,
				position,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
			})),
		),
	);
}

export function createWorkoutRows(createInput: WorkoutWriteInput) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx) => {
				const workoutId = await insertWorkoutRow(tx, createInput);
				const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(tx, createInput);
				await insertWorkoutExerciseRows(tx, workoutId, exercisesWithDatabaseIds);
				await insertWorkoutSetRows(tx, exercisesWithDatabaseIds);
				await rebuildPrHistoryForUserTx(tx, createInput.userId);

				return workoutId;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function updateWorkoutRows(
	updateInput: WorkoutUpdateInput,
	requireWorkout: RequireWorkoutForUpdate,
) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx) => {
				const workout = await getWorkoutForUpdate(tx, updateInput.workoutId, updateInput.userId);
				const workoutResult = requireWorkout(workout !== undefined);

				if (workoutResult.isErr()) {
					return workoutResult;
				}

				const exercisesWithDatabaseIds = await findOrCreateWorkoutExercises(tx, updateInput);
				await updateWorkoutFields(tx, updateInput);
				await deleteWorkoutChildren(tx, updateInput.workoutId);
				await insertWorkoutExerciseRows(tx, updateInput.workoutId, exercisesWithDatabaseIds);
				await insertWorkoutSetRows(tx, exercisesWithDatabaseIds);
				await rebuildPrHistoryForUserTx(tx, updateInput.userId);

				return workoutResult;
			}),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	}).andThen((result) => result);
}

export function getWorkoutForEdit(workoutId: string, userId: string) {
	return tryPromise({
		try: async (): Promise<WorkoutForEdit | null> => {
			const workout = await getWorkout(workoutId, userId);

			if (!workout) {
				return null;
			}

			const [exerciseRows, setRows] = await Promise.all([
				getWorkoutExerciseRows(workout.id),
				getWorkoutSetRows(workout.id),
			]);

			return {
				...workout,
				exercises: exerciseRows.map((exercise) => ({
					id: exercise.id,
					exerciseId: exercise.exerciseId,
					name: exercise.name,
					muscleGroups: exercise.muscleGroups,
					difficulty: exercise.difficulty,
					notes: exercise.notes,
					sets: setRows
						.filter((set) => set.workoutExerciseId === exercise.id)
						.map(({ workoutExerciseId: _workoutExerciseId, position: _position, ...set }) => set),
				})),
			};
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function listWorkoutRows(query: ListWorkoutsQuery) {
	return tryPromise({
		try: (): Promise<WorkoutHistoryRow[]> =>
			db
				.select({
					id: workouts.id,
					createdAt: workouts.createdAt,
					name: workouts.name,
					durationSeconds: workouts.durationSeconds,
					totalPrSets: workouts.totalPrSets,
					exerciseCount: countDistinct(workoutExercises.id),
					totalVolume: sql<number>`coalesce(sum(${workoutSets.weight} * ${workoutSets.reps})
						filter (where ${workoutSets.completed} = true),
						0
					)::double precision`,
					muscleGroups: sql<string[]>`(
						select coalesce(
							array_agg(distinct ${muscleGroups.name} order by ${muscleGroups.name}),
							array[]::text[]
						)
						from ${workoutExercises} as workout_exercises_for_muscle_groups
						join ${exerciseMuscleGroups} on ${exerciseMuscleGroups.exerciseId} = workout_exercises_for_muscle_groups.exercise_id
						join ${muscleGroups} on ${muscleGroups.id} = ${exerciseMuscleGroups.muscleGroupId}
						where workout_exercises_for_muscle_groups.workout_id = ${workouts.id}
					)`,
				})
				.from(workouts)
				.leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
				.leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
				.where(eq(workouts.userId, query.userId))
				.groupBy(workouts.id)
				.orderBy(desc(workouts.createdAt))
				.limit(query.limit + 1)
				.offset(query.offset),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
