import "server-only";

import { err, ok } from "neverthrow";

import {
	getNormalizedMuscleNamesForCategory,
	type MuscleGroupCategory,
} from "@/features/workout-form/lib/muscleGroupCategories";
import { normalizeName } from "@/lib/normalizeName";
import {
	deleteUserExercise,
	findUserExerciseRowByNormalizedName,
	getUserExerciseRow,
	insertUserExercise,
	listUserExerciseRows,
	mergeUserExerciseRows,
	updateUserExerciseRow,
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

	return findUserExerciseRowByNormalizedName(userId, normalizedName)
		.andThen((existingExercise) => {
			if (existingExercise !== null) {
				return err({
					reason: "NAME_COLLISION" as const,
					existingExercise,
				});
			}

			return ok(null);
		})
		.andThen(() => insertUserExercise(userId, input.name.trim(), normalizedName, muscleGroups))
		.andThen((exerciseId) => getUserExerciseRow(userId, exerciseId))
		.andThen(requireUserExercise)
		.map((exercise) => ({ exercise }));
}

export function updateUserExercise(userId: string, input: UpdateExerciseCatalogInput) {
	const normalizedName = normalizeName(input.name);
	const muscleGroups = normalizeMuscleGroupsForSave(input.muscleGroups);

	return getUserExerciseRow(userId, input.id)
		.andThen(requireUserExercise)
		.andThen(() => findUserExerciseRowByNormalizedName(userId, normalizedName))
		.andThen((existingExercise) => {
			if (existingExercise !== null && existingExercise.id !== input.id) {
				return err({
					reason: "NAME_COLLISION" as const,
					existingExercise,
				});
			}

			return ok(null);
		})
		.andThen(() =>
			updateUserExerciseRow(userId, input.id, input.name.trim(), normalizedName, muscleGroups),
		)
		.andThen(() => getUserExerciseRow(userId, input.id))
		.andThen(requireUserExercise)
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
		.andThen((source) => {
			if (sourceMuscleGroups === null) {
				return ok(source);
			}

			return updateUserExerciseRow(
				userId,
				sourceId,
				source.name,
				normalizeName(source.name),
				sourceMuscleGroups,
			).map(() => source);
		})
		.andThen(() => getUserExerciseRow(userId, targetId))
		.andThen(requireUserExercise)
		.andThen(() => mergeUserExerciseRows(userId, sourceId, targetId))
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
