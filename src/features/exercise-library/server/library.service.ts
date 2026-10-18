import "server-only";

import { Effect } from "effect";
import { withTransaction } from "@/lib/db/sql";
import { recalculateExercisePrHistory } from "@/features/personal-records/server/pr-history.service";
import { ExerciseDb } from "@/features/exercise-library/server/exercises.db";
import { normalizeName } from "@/lib/normalizeName";
import { normalizeMuscleGroups } from "@/features/exercise-library/lib/normalizeMuscleGroups";
import { DatabaseError } from "@/lib/db/database";
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

		return yield* withTransaction(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;

				const exerciseId = yield* db.insertUserExercise({
					userId: input.userId,
					name: exercise.name,
					normalizedName: exercise.normalizedName,
				});

				yield* db.addMuscleGroups({ exerciseId, groups: exercise.muscleGroups });
				const row = yield* db.getUserExercise({ userId: input.userId, exerciseId });

				if (!row) {
					return yield* Effect.fail(
						new DatabaseError({ cause: new Error("Created exercise was not found") }),
					);
				}

				return row;
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

		return yield* withTransaction(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;

				const updatedExerciseId = yield* db.updateUserExercise({
					userId: input.userId,
					exerciseId: input.exerciseId,
					name: exercise.name,
					normalizedName: exercise.normalizedName,
				});

				if (updatedExerciseId === null) return yield* Effect.fail(new ExerciseNotFoundError());
				yield* replaceMuscleGroupsIfChanged(db, input.exerciseId, exercise.muscleGroups);

				const row = yield* db.getUserExercise({
					userId: input.userId,
					exerciseId: input.exerciseId,
				});

				return yield* requireUserExercise(row);
			}),
		);
	});

function muscleGroupNamesMatch(currentNames: string[], incomingNames: string[]) {
	const currentSorted = currentNames.toSorted();
	const incomingSorted = incomingNames.toSorted();

	return (
		currentSorted.length === incomingSorted.length &&
		currentSorted.every((name, index) => name === incomingSorted[index])
	);
}

function replaceMuscleGroupsIfChanged(
	db: ExerciseDb["Service"],
	exerciseId: string,
	groups: ReturnType<typeof normalizeMuscleGroups>,
) {
	return Effect.gen(function* () {
		const currentNames = yield* db.getMuscleGroupNames(exerciseId);
		const incomingNames = groups.map((group) => group.normalizedName);

		if (muscleGroupNamesMatch(currentNames, incomingNames)) return;

		yield* db.deleteMuscleGroups(exerciseId);
		yield* db.addMuscleGroups({ exerciseId, groups });
	});
}

export const deleteUserExercise = (userId: string, exerciseId: string) =>
	Effect.gen(function* () {
		const exercise = yield* requireUnusedExercise(yield* getUserExercise(userId, exerciseId));
		const db = yield* ExerciseDb;
		yield* db.deleteUserExercise({ userId, exerciseId: exercise.id });

		return { deleted: true as const };
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

		yield* withTransaction(
			Effect.gen(function* () {
				const db = yield* ExerciseDb;

				const [source, target] = yield* Effect.all(
					[
						db.getUserExercise({ userId, exerciseId: sourceId }),
						db.getUserExercise({ userId, exerciseId: targetId }),
					],
					{ concurrency: "unbounded" },
				);

				if (!source || !target) return yield* Effect.fail(new ExerciseNotFoundError());

				if (sourceMuscleGroups !== null) {
					yield* replaceMuscleGroupsIfChanged(db, sourceId, sourceMuscleGroups);
				}

				const cutoff = yield* db.findMergeCutoff({ userId, sourceId, targetId });
				yield* db.unionMuscleGroups({ sourceId, targetId });
				yield* db.moveWorkoutExercises({ sourceId, targetId });
				yield* db.deleteUserExercise({ userId, exerciseId: sourceId });

				if (cutoff) {
					yield* recalculateExercisePrHistory({
						userId,
						exerciseIds: [sourceId, targetId],
						cutoff,
					});
				}
			}),
		);

		const targetExercise = yield* getUserExercise(userId, targetId);

		return { targetExercise };
	});
