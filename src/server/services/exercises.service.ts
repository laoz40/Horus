import "server-only";

import { err, ok } from "neverthrow";

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
	userExerciseExists,
} from "@/server/services/exercises-catalog.db";
import {
	normalizeMuscleGroupsForSave,
	requireUnusedExercise,
	requireUserExercise,
} from "@/server/services/exercises-catalog.functions";
import {
	getExercisePrRows,
	getRecentSetRows,
	listExerciseRowsByCategory,
	searchExerciseRows,
} from "@/server/services/exercises.db";
import { buildRecentSets, checkCompletedSetPr } from "@/server/services/exercises.functions";
import { emptyExercisePrs } from "@/server/services/pr-history.functions";

interface ExerciseCatalogWriteInput {
	name: string;
	muscleGroups: string[];
}

interface UpdateExerciseCatalogInput extends ExerciseCatalogWriteInput {
	id: string;
}

interface MergeExerciseCatalogInput {
	sourceId: string;
	targetId: string;
	sourceMuscleGroups?: string[];
}

export function listUserExercises(userId: string) {
	return listUserExerciseRows(userId);
}

export function createUserExercise(userId: string, input: ExerciseCatalogWriteInput) {
	const normalizedName = normalizeName(input.name);
	const muscleGroups = normalizeMuscleGroupsForSave(input.muscleGroups);

	return findUserExerciseIdByNormalizedName(userId, normalizedName)
		.andThen((existingExerciseId) => {
			if (existingExerciseId === null) {
				return ok(null);
			}

			return getUserExerciseRow(userId, existingExerciseId)
				.andThen(requireUserExercise)
				.andThen((existingExercise) =>
					err({
						reason: "NAME_COLLISION" as const,
						existingExercise,
					}),
				);
		})
		.andThen(() => insertUserExercise(userId, input.name.trim(), normalizedName, muscleGroups))
		.map((exercise) => ({ exercise }));
}

export function updateUserExercise(userId: string, input: UpdateExerciseCatalogInput) {
	const normalizedName = normalizeName(input.name);
	const muscleGroups = normalizeMuscleGroupsForSave(input.muscleGroups);

	return userExerciseExists(userId, input.id)
		.andThen((exists) => {
			if (!exists) {
				return err({ reason: "EXERCISE_NOT_FOUND" as const });
			}

			return ok(null);
		})
		.andThen(() => findUserExerciseIdByNormalizedName(userId, normalizedName))
		.andThen((existingExerciseId) => {
			if (existingExerciseId === null || existingExerciseId === input.id) {
				return ok(null);
			}

			return getUserExerciseRow(userId, existingExerciseId)
				.andThen(requireUserExercise)
				.andThen((existingExercise) =>
					err({
						reason: "NAME_COLLISION" as const,
						existingExercise,
					}),
				);
		})
		.andThen(() =>
			updateUserExerciseRow(userId, input.id, input.name.trim(), normalizedName, muscleGroups),
		)
		.map((exercise) => ({ exercise }));
}

export function deleteUserExerciseById(userId: string, exerciseId: string) {
	return getUserExerciseRow(userId, exerciseId)
		.andThen(requireUserExercise)
		.andThen(requireUnusedExercise)
		.andThen(() => deleteUserExercise(userId, exerciseId))
		.map(() => ({ deleted: true as const }));
}

export function mergeUserExercises(userId: string, input: MergeExerciseCatalogInput) {
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

	return getUserExerciseRow(userId, sourceId)
		.andThen(requireUserExercise)
		.andThen(() => getUserExerciseRow(userId, targetId))
		.andThen(requireUserExercise)
		.andThen(() => mergeUserExerciseRows(userId, sourceId, targetId, sourceMuscleGroups))
		.andThen(() => getUserExerciseRow(userId, targetId))
		.andThen(requireUserExercise)
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

export function getRecentSets(userId: string, exerciseName: string) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getRecentSetRows(userId, normalizedExerciseName).map(buildRecentSets);
}

interface CheckSetPrInput {
	userId: string;
	exerciseName: string;
	sets: { completed: boolean; weight?: number; reps?: number }[];
	setIndex: number;
}

export function checkSetPr({ userId, exerciseName, sets, setIndex }: CheckSetPrInput) {
	const normalizedExerciseName = normalizeName(exerciseName);

	return getExercisePrRows(userId, normalizedExerciseName).map((rows) =>
		checkCompletedSetPr(sets, setIndex, rows[0] ?? emptyExercisePrs()),
	);
}
