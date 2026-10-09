import "server-only";

import { Effect } from "effect";
import { DatabaseError } from "@/lib/db/database";

import {
	getUserExerciseCatalogRow as getUserExerciseLibraryRowQuery,
	getExerciseMuscleGroupNormalizedNames as getExerciseMuscleGroupNormalizedNamesQuery,
	unionExerciseMuscleGroups,
	getEarliestAffectedWorkoutCutoff as getEarliestAffectedWorkoutCutoffQuery,
	getUserExerciseId,
	deleteUserExercise,
	deleteExerciseMuscleGroups,
} from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";

type Tx = DatabaseTransaction;

export function getUserExerciseLibraryRow(database: Tx, userId: string, exerciseId: string) {
	return Effect.gen(function* () {
		const [row] = yield* Effect.tryPromise({
			try: () => database.$queryRawTyped(getUserExerciseLibraryRowQuery(userId, exerciseId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!row) {
			return null;
		}

		return {
			id: row.id,
			name: row.name,
			muscleGroups: row.muscle_groups ?? [],
			workoutCount: row.workout_count ?? 0,
		};
	});
}

export function getOrCreateMuscleGroupId(
	tx: Tx,
	muscleGroup: { name: string; normalizedName: string },
) {
	return Effect.gen(function* () {
		const row = yield* Effect.tryPromise({
			try: () =>
				tx.muscle_groups.upsert({
					where: { normalized_name: muscleGroup.normalizedName },
					create: {
						name: muscleGroup.name,
						normalized_name: muscleGroup.normalizedName,
					},
					update: {},
					select: { id: true },
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return row.id;
	});
}

function getExerciseMuscleGroupNormalizedNames(tx: Tx, exerciseId: string) {
	return Effect.gen(function* () {
		const rows = yield* Effect.tryPromise({
			try: () => tx.$queryRawTyped(getExerciseMuscleGroupNormalizedNamesQuery(exerciseId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return rows.map((row) => row.normalized_name).toSorted();
	});
}

function exerciseMuscleGroupsUnchanged(
	currentNormalizedNames: string[],
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
): boolean {
	if (currentNormalizedNames.length !== muscleGroupsForExercise.length) {
		return false;
	}

	const incomingNormalizedNames = muscleGroupsForExercise
		.map((muscleGroup) => muscleGroup.normalizedName)
		.toSorted();

	return currentNormalizedNames.every(
		(normalizedName, index) => normalizedName === incomingNormalizedNames[index],
	);
}

export function replaceExerciseMuscleGroups(
	tx: Tx,
	exerciseId: string,
	muscleGroupsForExercise: Array<{ name: string; normalizedName: string }>,
) {
	return Effect.gen(function* () {
		const currentNormalizedNames = yield* getExerciseMuscleGroupNormalizedNames(tx, exerciseId);

		if (exerciseMuscleGroupsUnchanged(currentNormalizedNames, muscleGroupsForExercise)) {
			return;
		}

		yield* Effect.tryPromise({
			try: () => tx.$queryRawTyped(deleteExerciseMuscleGroups(exerciseId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (muscleGroupsForExercise.length === 0) {
			return;
		}

		const muscleGroupIds = yield* Effect.forEach(
			muscleGroupsForExercise,
			(muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup),
			{ concurrency: "unbounded" },
		);

		yield* Effect.tryPromise({
			try: () =>
				tx.exercise_muscle_groups.createMany({
					data: muscleGroupIds.map((muscleGroupId) => ({
						exercise_id: exerciseId,
						muscle_group_id: muscleGroupId,
					})),
					skipDuplicates: true,
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});
	});
}

function getEarliestAffectedWorkoutCutoff(tx: Tx, userId: string, exerciseIds: string[]) {
	return Effect.gen(function* () {
		const [row] = yield* Effect.tryPromise({
			try: () => tx.$queryRawTyped(getEarliestAffectedWorkoutCutoffQuery(userId, exerciseIds)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		if (!row) {
			return null;
		}

		return {
			workoutId: row.id,
			createdAt: row.created_at,
		};
	});
}

export function mergeUserExerciseRows(
	tx: Tx,
	userId: string,
	sourceId: string,
	targetId: string,
	sourceMuscleGroupsForExercise: Array<{ name: string; normalizedName: string }> | null = null,
) {
	return Effect.gen(function* () {
		const [sourceRows, targetRows] = yield* Effect.all(
			[
				Effect.tryPromise({
					try: () => tx.$queryRawTyped(getUserExerciseId(userId, sourceId)),
					catch: (cause) => new DatabaseError({ cause }),
				}),
				Effect.tryPromise({
					try: () => tx.$queryRawTyped(getUserExerciseId(userId, targetId)),
					catch: (cause) => new DatabaseError({ cause }),
				}),
			],
			{ concurrency: "unbounded" },
		);

		const [source] = sourceRows;
		const [target] = targetRows;

		if (!source || !target) {
			return null;
		}

		if (sourceMuscleGroupsForExercise !== null) {
			yield* replaceExerciseMuscleGroups(tx, sourceId, sourceMuscleGroupsForExercise);
		}

		const cutoff = yield* getEarliestAffectedWorkoutCutoff(tx, userId, [sourceId, targetId]);

		yield* Effect.tryPromise({
			try: () => tx.$queryRawTyped(unionExerciseMuscleGroups(sourceId, targetId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		yield* Effect.tryPromise({
			try: () =>
				tx.workout_exercises.updateMany({
					where: { exercise_id: sourceId },
					data: { exercise_id: targetId },
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});

		yield* Effect.tryPromise({
			try: () => tx.$queryRawTyped(deleteUserExercise(userId, sourceId)),
			catch: (cause) => new DatabaseError({ cause }),
		});

		return { cutoff };
	});
}
