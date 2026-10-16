import "server-only";

import { Effect } from "effect";
import { Transactions } from "@/server/transactions";
import { recalculateExercisePrHistory } from "@/features/personal-records/server/pr-history.service";
import { ExerciseDb } from "@/features/exercise-library/server/exercises.db";
import { normalizeName } from "@/lib/normalizeName";
import { normalizeMuscleGroups } from "@/features/exercise-library/lib/normalizeMuscleGroups";
import {
	ExerciseNameCollisionError,
	ExerciseNotFoundError,
	requireUnusedExercise,
	requireUserExercise,
} from "@/features/exercise-library/server/library.functions";

interface ExerciseLibraryWriteInput {
	name: string;
	muscleGroups: string[];
}

interface MergeExerciseLibraryInput {
	sourceId: string;
	targetId: string;
	sourceMuscleGroups?: string[];
}

export const listUserExercises = (userId: string) =>
	Effect.gen(function* () {
		const db = yield* ExerciseDb;

		return yield* db.listUserExercises(userId);
	});

function normalizeExerciseInput(input: ExerciseLibraryWriteInput) {
	return {
		name: input.name.trim(),
		normalizedName: normalizeName(input.name),
		muscleGroups: normalizeMuscleGroups(input.muscleGroups),
	};
}

interface ExerciseNameQuery {
	userId: string;
	normalizedName: string;
	excludingExerciseId?: string;
}

const getUserExercise = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		const db = yield* ExerciseDb;

		return yield* requireUserExercise(yield* db.getUserExercise({ userId, exerciseId }));
	});

const validateExerciseNameAvailability = ({
	userId,
	normalizedName,
	excludingExerciseId,
}: ExerciseNameQuery) =>
	Effect.gen(function* () {
		const db = yield* ExerciseDb;

		const existingExerciseId = yield* db.findUserExerciseIdByNormalizedName({
			userId,
			normalizedName,
		});

		if (existingExerciseId === null || existingExerciseId === excludingExerciseId) {
			return null;
		}

		const existingExercise = yield* getUserExercise(userId, existingExerciseId);

		return yield* Effect.fail(new ExerciseNameCollisionError({ existingExercise }));
	});

interface CreateExerciseInput {
	userId: string;
	exercise: ExerciseLibraryWriteInput;
}

export const createUserExercise = (input: CreateExerciseInput) =>
	Effect.gen(function* () {
		const exercise = normalizeExerciseInput(input.exercise);
		yield* validateExerciseNameAvailability({
			userId: input.userId,
			normalizedName: exercise.normalizedName,
		});

		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;

				return yield* db.create({ userId: input.userId, exercise });
			}),
		);
	});

interface UpdateExerciseInput extends CreateExerciseInput {
	exerciseId: string;
}

export const updateUserExercise = (input: UpdateExerciseInput) =>
	Effect.gen(function* () {
		const exercise = normalizeExerciseInput(input.exercise);
		yield* getUserExercise(input.userId, input.exerciseId);
		yield* validateExerciseNameAvailability({
			userId: input.userId,
			normalizedName: exercise.normalizedName,
			excludingExerciseId: input.exerciseId,
		});

		const transaction = yield* Transactions;

		return yield* transaction.run(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;

				return yield* db.update({
					userId: input.userId,
					exerciseId: input.exerciseId,
					exercise,
				});
			}),
		);
	});

export const deleteUserExercise = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		const exercise = yield* requireUnusedExercise(yield* getUserExercise(userId, exerciseId));
		const db = yield* ExerciseDb;
		yield* db.deleteUserExercise({ userId, exerciseId: exercise.id });

		return { deleted: true as const };
	});

const mergeExercisesAndRecalculatePrs = (
	userId: string,
	sourceId: string,
	targetId: string,
	sourceMuscleGroups: ReturnType<typeof normalizeMuscleGroups> | null,
) =>
	Effect.gen(function* () {
		const transaction = yield* Transactions;
		yield* transaction.run(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;
				const cutoff = yield* db.merge({ userId, sourceId, targetId, sourceMuscleGroups });

				if (cutoff) {
					yield* recalculateExercisePrHistory({
						userId,
						exerciseIds: [sourceId, targetId],
						cutoff,
					});
				}
			}),
		);
	});

export const mergeUserExercises = (userId: string, input: MergeExerciseLibraryInput) =>
	Effect.gen(function* () {
		const { sourceId, targetId } = input;

		if (sourceId === targetId) {
			const db = yield* ExerciseDb;
			yield* db.getUserExercise({ userId, exerciseId: sourceId });

			return yield* Effect.fail(new ExerciseNotFoundError());
		}

		const sourceMuscleGroups = input.sourceMuscleGroups
			? normalizeMuscleGroups(input.sourceMuscleGroups)
			: null;

		yield* getUserExercise(userId, sourceId);
		yield* getUserExercise(userId, targetId);
		yield* mergeExercisesAndRecalculatePrs(userId, sourceId, targetId, sourceMuscleGroups);
		const targetExercise = yield* getUserExercise(userId, targetId);

		return { targetExercise };
	});
