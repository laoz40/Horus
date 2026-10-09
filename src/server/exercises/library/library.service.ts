import "server-only";

import { Effect } from "effect";
import { Database, DatabaseError } from "@/lib/db/database";
import { recalculateExercisePrHistory } from "@/server/exercises/pr-history/pr-history.service";
import { ExerciseDb } from "@/server/exercises/library/exercises.db";

import {
	getNormalizedMuscleNamesForCategory,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";
import {
	deleteUserExercise,
	insertUserExercise,
	mergeUserExerciseRows,
	updateUserExerciseRow,
} from "@/server/exercises/library/library.repository";
import {
	ExerciseNameCollisionError,
	ExerciseNotFoundError,
	normalizeMuscleGroupsForSave,
	requireUnusedExercise,
	requireUserExercise,
} from "@/server/exercises/library/library.functions";

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

export function normalizeExerciseInput(input: ExerciseLibraryWriteInput) {
	return {
		name: input.name.trim(),
		normalizedName: normalizeName(input.name),
		muscleGroups: normalizeMuscleGroupsForSave(input.muscleGroups),
	};
}

type NormalizedExercise = ReturnType<typeof normalizeExerciseInput>;

interface ExerciseNameQuery {
	userId: string;
	normalizedName: string;
	excludingExerciseId?: string;
}

export const getUserExercise = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		const db = yield* ExerciseDb;

		return yield* requireUserExercise(yield* db.getUserExercise({ userId, exerciseId }));
	});

export const validateExerciseNameAvailability = ({
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
	exercise: NormalizedExercise;
}

export const createUserExercise = ({ userId, exercise }: CreateExerciseInput) =>
	Effect.gen(function* () {
		return yield* insertUserExercise(
			userId,
			exercise.name,
			exercise.normalizedName,
			exercise.muscleGroups,
		);
	});

interface UpdateExerciseInput extends CreateExerciseInput {
	exerciseId: string;
}

export const updateUserExercise = ({ userId, exerciseId, exercise }: UpdateExerciseInput) =>
	Effect.gen(function* () {
		return yield* updateUserExerciseRow(
			userId,
			exerciseId,
			exercise.name,
			exercise.normalizedName,
			exercise.muscleGroups,
		);
	});

export const getUnusedUserExercise = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		return yield* requireUnusedExercise(yield* getUserExercise(userId, exerciseId));
	});

export const deleteUserExerciseById = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		yield* deleteUserExercise(userId, exerciseId);

		return { deleted: true as const };
	});

const mergeExercisesAndRecalculatePrs = (
	userId: string,
	sourceId: string,
	targetId: string,
	sourceMuscleGroups: ReturnType<typeof normalizeMuscleGroupsForSave> | null,
) =>
	Effect.gen(function* () {
		const { prisma } = yield* Database;

		yield* Effect.tryPromise({
			try: () =>
				prisma.$transaction(async (tx) => {
					const cutoff = await mergeUserExerciseRows(
						tx,
						userId,
						sourceId,
						targetId,
						sourceMuscleGroups,
					);

					if (cutoff) {
						await recalculateExercisePrHistory(tx, userId, [sourceId, targetId], cutoff);
					}
				}),
			catch: (cause) => new DatabaseError({ cause }),
		});
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
			? normalizeMuscleGroupsForSave(input.sourceMuscleGroups)
			: null;

		yield* getUserExercise(userId, sourceId);
		yield* getUserExercise(userId, targetId);
		yield* mergeExercisesAndRecalculatePrs(userId, sourceId, targetId, sourceMuscleGroups);
		const targetExercise = yield* getUserExercise(userId, targetId);

		return { targetExercise };
	});

export const searchExercises = (userId: string, query: string) =>
	Effect.gen(function* () {
		const normalizedQuery = normalizeName(query);
		const db = yield* ExerciseDb;

		return yield* db.searchExercises({ userId, normalizedQuery });
	});

export const listExercisesByCategory = (userId: string, category: MuscleGroupCategory) =>
	Effect.gen(function* () {
		const normalizedMuscleNames = getNormalizedMuscleNamesForCategory(category);
		const db = yield* ExerciseDb;

		return yield* db.listByCategory({ userId, normalizedMuscleNames });
	});
