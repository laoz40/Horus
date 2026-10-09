import "server-only";

import { Effect } from "effect";
import { DatabaseError } from "@/lib/db/database";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { findUserExerciseIdByNormalizedName } from "@/generated/prisma/sql";
import type { DatabaseTransaction } from "@/lib/db";
import { getOrCreateMuscleGroupId } from "@/server/exercises/library/library.db";

type Tx = DatabaseTransaction;

type WorkoutWriteExercise = WorkoutForSave["exercises"][number];

export type PreparedWorkoutWriteExercise = Omit<WorkoutWriteExercise, "global"> & {
	global: Omit<WorkoutWriteExercise["global"], "muscleGroups"> & {
		normalizedName: string;
		muscleGroups: Array<{ name: string; normalizedName: string }>;
	};
};

export type WorkoutExerciseWithDatabaseId = PreparedWorkoutWriteExercise & { exerciseId: string };

export function findOrCreateWorkoutExercises(
	tx: Tx,
	userId: string,
	exercisesForWorkout: PreparedWorkoutWriteExercise[],
) {
	// Duplicates by name still resolve to the same row: the insert handles conflicts.
	return Effect.forEach(
		exercisesForWorkout,
		(exercise) =>
			Effect.gen(function* () {
				// Names are unique per user, so a matching submitted ID resolves to this same row.
				const [existing] = yield* Effect.tryPromise({
					try: () =>
						tx.$queryRawTyped(
							findUserExerciseIdByNormalizedName(userId, exercise.global.normalizedName),
						),
					catch: (cause) => new DatabaseError({ cause }),
				});

				if (existing) {
					return { ...exercise, exerciseId: existing.id };
				}

				const created = yield* Effect.tryPromise({
					try: () =>
						tx.exercises.createMany({
							data: [
								{
									user_id: userId,
									name: exercise.global.name,
									normalized_name: exercise.global.normalizedName,
								},
							],
							skipDuplicates: true,
						}),
					catch: (cause) => new DatabaseError({ cause }),
				});

				const [resolved] = yield* Effect.tryPromise({
					try: () =>
						tx.$queryRawTyped(
							findUserExerciseIdByNormalizedName(userId, exercise.global.normalizedName),
						),
					catch: (cause) => new DatabaseError({ cause }),
				});

				if (!resolved)
					return yield* Effect.fail(
						new DatabaseError({
							cause: new Error("Exercise conflict did not resolve to an existing row"),
						}),
					);

				if (created.count > 0) {
					const muscleGroupIds = yield* Effect.forEach(
						exercise.global.muscleGroups,
						(muscleGroup) => getOrCreateMuscleGroupId(tx, muscleGroup),
						{ concurrency: "unbounded" },
					);

					yield* Effect.tryPromise({
						try: () =>
							tx.exercise_muscle_groups.createMany({
								data: muscleGroupIds.map((id) => ({
									exercise_id: resolved.id,
									muscle_group_id: id,
								})),
								skipDuplicates: true,
							}),
						catch: (cause) => new DatabaseError({ cause }),
					});
				}

				return { ...exercise, exerciseId: resolved.id };
			}),
		{ concurrency: "unbounded" },
	);
}
