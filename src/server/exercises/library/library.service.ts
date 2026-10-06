import "server-only";

import { err, ok } from "neverthrow";
import { runDatabaseTransaction } from "@/lib/db";
import { tryPromise } from "@/lib/tryPromise";
import { recalculateExercisePrHistory } from "@/server/exercises/pr-history/pr-history.service";

import {
	getNormalizedMuscleNamesForCategory,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";
import {
	deleteUserExercise,
	findUserExerciseIdByNormalizedName,
	getUserExerciseRow,
	insertUserExercise,
	listUserExerciseRows,
	mergeUserExerciseRows,
	updateUserExerciseRow,
} from "@/server/exercises/library/library.repository";
import {
	normalizeMuscleGroupsForSave,
	requireUnusedExercise,
	requireUserExercise,
} from "@/server/exercises/library/library.functions";
import {
	listExerciseRowsByCategory,
	searchExerciseRows,
} from "@/server/exercises/library/library.repository";

interface ExerciseLibraryWriteInput {
	name: string;
	muscleGroups: string[];
}

interface MergeExerciseLibraryInput {
	sourceId: string;
	targetId: string;
	sourceMuscleGroups?: string[];
}

export function listUserExercises(userId: string) {
	return listUserExerciseRows(userId);
}

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

export function getUserExercise(userId: string, exerciseId: string) {
	return getUserExerciseRow(userId, exerciseId).andThen(requireUserExercise);
}

export function validateExerciseNameAvailability({
	userId,
	normalizedName,
	excludingExerciseId,
}: ExerciseNameQuery) {
	return findUserExerciseIdByNormalizedName(userId, normalizedName).andThen(
		(existingExerciseId) => {
			if (existingExerciseId === null || existingExerciseId === excludingExerciseId) {
				return ok(null);
			}

			return getUserExercise(userId, existingExerciseId).andThen((existingExercise) =>
				err({ reason: "NAME_COLLISION" as const, existingExercise }),
			);
		},
	);
}

interface CreateExerciseInput {
	userId: string;
	exercise: NormalizedExercise;
}

export function createUserExercise({ userId, exercise }: CreateExerciseInput) {
	return insertUserExercise(userId, exercise.name, exercise.normalizedName, exercise.muscleGroups);
}

interface UpdateExerciseInput extends CreateExerciseInput {
	exerciseId: string;
}

export function updateUserExercise({ userId, exerciseId, exercise }: UpdateExerciseInput) {
	return updateUserExerciseRow(
		userId,
		exerciseId,
		exercise.name,
		exercise.normalizedName,
		exercise.muscleGroups,
	);
}

export function getUnusedUserExercise(userId: string, exerciseId: string) {
	return getUserExercise(userId, exerciseId).andThen(requireUnusedExercise);
}

export function deleteUserExerciseById(userId: string, exerciseId: string) {
	return deleteUserExercise(userId, exerciseId).map(() => ({ deleted: true as const }));
}

function mergeExercisesAndRecalculatePrs(
	userId: string,
	sourceId: string,
	targetId: string,
	sourceMuscleGroups: ReturnType<typeof normalizeMuscleGroupsForSave> | null,
) {
	return tryPromise({
		try: () =>
			runDatabaseTransaction(async (tx) => {
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
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function mergeUserExercises(userId: string, input: MergeExerciseLibraryInput) {
	const { sourceId, targetId } = input;

	if (sourceId === targetId) {
		return getUserExerciseRow(userId, sourceId).andThen(() =>
			err({
				reason: "EXERCISE_NOT_FOUND" as const,
			}),
		);
	}

	const sourceMuscleGroups = input.sourceMuscleGroups
		? normalizeMuscleGroupsForSave(input.sourceMuscleGroups)
		: null;

	return getUserExercise(userId, sourceId)
		.andThen(() => getUserExercise(userId, targetId))
		.andThen(() => mergeExercisesAndRecalculatePrs(userId, sourceId, targetId, sourceMuscleGroups))
		.andThen(() => getUserExercise(userId, targetId))
		.map((targetExercise) => ({ targetExercise }));
}

export function searchExercises(userId: string, query: string) {
	const normalizedQuery = normalizeName(query);

	return searchExerciseRows(userId, normalizedQuery);
}

export function listExercisesByCategory(userId: string, category: MuscleGroupCategory) {
	const normalizedMuscleNames = getNormalizedMuscleNamesForCategory(category);

	return listExerciseRowsByCategory(userId, normalizedMuscleNames);
}
