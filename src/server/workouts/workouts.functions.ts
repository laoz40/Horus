import "server-only";

import { Data, Effect } from "effect";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { buildSetPrTypes } from "@/features/workout-form/lib/setPr";
import { normalizeName } from "@/lib/normalizeName";
import type { WorkoutExerciseWithDatabaseId } from "@/server/exercises/library/workout-exercises.db";
import type {
	ListWorkoutsQuery,
	WorkoutForEdit,
	WorkoutHistoryRow,
} from "@/server/workouts/workouts.db";

class WorkoutNotFoundError extends Data.TaggedError("NOT_FOUND") {}

class NoWorkoutsError extends Data.TaggedError("NO_WORKOUTS") {}

class InvalidWorkoutInputError extends Data.TaggedError("INVALID_INPUT") {}

export function requireWorkout<T>(workout: T | null) {
	if (workout === null) {
		return Effect.fail(new WorkoutNotFoundError());
	}

	return Effect.succeed(workout);
}

export function requireDeletedWorkouts(result: { deletedCount: number }) {
	if (result.deletedCount === 0) {
		return Effect.fail(new NoWorkoutsError());
	}

	return Effect.succeed(result);
}

function normalizeMuscleGroups(muscleGroups: string[] | undefined) {
	const muscleGroupsByNormalizedName = new Map<string, { name: string; normalizedName: string }>();

	for (const name of muscleGroups ?? []) {
		const normalizedName = normalizeName(name);

		if (normalizedName.length === 0 || muscleGroupsByNormalizedName.has(normalizedName)) {
			continue;
		}

		muscleGroupsByNormalizedName.set(normalizedName, {
			name: name.trim(),
			normalizedName,
		});
	}

	return [...muscleGroupsByNormalizedName.values()];
}

export function validateUniqueWorkoutChildIds(workout: WorkoutForSave) {
	const workoutExerciseIds = workout.exercises.map((exercise) => exercise.id);
	const setIds = workout.exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));

	const hasDuplicateWorkoutExerciseId =
		new Set(workoutExerciseIds).size !== workoutExerciseIds.length;

	const hasDuplicateSetId = new Set(setIds).size !== setIds.length;

	if (hasDuplicateWorkoutExerciseId || hasDuplicateSetId) {
		return Effect.fail(new InvalidWorkoutInputError());
	}

	return Effect.succeed(null);
}

export function normalizeWorkoutForWrite(workout: WorkoutForSave) {
	return {
		...workout,
		exercises: workout.exercises.map((exercise) => ({
			...exercise,
			global: {
				name: exercise.global.name,
				normalizedName: normalizeName(exercise.global.name),
				muscleGroups: normalizeMuscleGroups(exercise.global.muscleGroups),
			},
		})),
	};
}

export function buildNewWorkoutPrSets(
	workoutId: string,
	exercisesForWorkout: WorkoutExerciseWithDatabaseId[],
) {
	return exercisesForWorkout.flatMap((exercise) =>
		exercise.sets.map((set) => ({
			setId: set.id,
			workoutId,
			exerciseId: exercise.exerciseId,
			weight: set.weight,
			reps: set.reps,
			completed: set.completed,
		})),
	);
}

export function buildWorkoutEditForm(workout: WorkoutForEdit) {
	return {
		name: workout.name,
		createdAt: workout.createdAt.getTime(),
		durationSeconds: workout.durationSeconds,
		exercises: workout.exercises.map((exercise) => ({
			id: exercise.id,
			exerciseId: exercise.exerciseId,
			global: {
				name: exercise.name,
				muscleGroups: exercise.muscleGroups,
			},
			difficulty: exercise.difficulty ?? undefined,
			notes: exercise.notes || undefined,
			sets: exercise.sets.map((set) => ({
				id: set.id,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
				prTypes: buildSetPrTypes(set),
			})),
		})),
	};
}

export function buildWorkoutHistoryPage(rows: WorkoutHistoryRow[], query: ListWorkoutsQuery) {
	const pageWorkouts = rows.slice(0, query.limit);

	return {
		items: pageWorkouts.map((workout) => ({
			id: workout.id,
			createdAt: workout.createdAt.getTime(),
			name: workout.name,
			durationSeconds: workout.durationSeconds,
			totalVolume: workout.totalVolume,
			totalPrSets: workout.totalPrSets,
			exerciseCount: workout.exerciseCount,
			muscleGroups: workout.muscleGroups,
		})),
		// If an extra row exists, another page is available.
		nextOffset: rows.length > query.limit ? query.offset + query.limit : null,
	};
}
