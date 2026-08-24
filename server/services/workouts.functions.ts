import "server-only";

import { err, ok } from "neverthrow";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import { normalizeName } from "@/lib/normalizeName";
import type {
	ListWorkoutsQuery,
	WorkoutForEdit,
	WorkoutHistoryRow,
} from "@/server/services/workouts.db";

export function requireWorkout<T>(workout: T | null) {
	if (workout === null) {
		return err({ reason: "NOT_FOUND" as const });
	}

	return ok(workout);
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
		return err({ reason: "INVALID_INPUT" as const });
	}

	return ok(null);
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

export function requireWorkoutForUpdate(workoutExists: boolean) {
	if (!workoutExists) {
		return err({ reason: "NOT_FOUND" as const });
	}

	return ok(null);
}

export function buildWorkoutEditForm(workout: WorkoutForEdit) {
	return {
		name: workout.name,
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
			sets: exercise.sets,
		})),
	};
}

export function buildWorkoutHistoryPage(rows: WorkoutHistoryRow[], query: ListWorkoutsQuery) {
	const pageWorkouts = rows.slice(0, query.limit);

	return {
		items: pageWorkouts.map((workout) => ({
			_id: workout.id,
			_creationTime: workout.createdAt.getTime(),
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
