import "server-only";

import { Data, Effect } from "effect";
import type { WorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { normalizeName } from "@/lib/normalizeName";
import { normalizeMuscleGroups } from "@/features/exercise-library/lib/normalizeMuscleGroups";
import { DatabaseError } from "@/lib/db/database";
import type { StoredWorkoutExercise } from "@/features/workout-form/server/workout-form.db";
import type {
	PreparedWorkoutWriteExercise,
	StoredExercise,
	WorkoutExerciseWithDatabaseId,
} from "@/features/workout-form/server/workout-exercises.db";

class InvalidWorkoutInputError extends Data.TaggedError("INVALID_INPUT") {}

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

type WorkoutSetForComparison = Pick<
	StoredWorkoutExercise["sets"][number],
	"id" | "weight" | "reps" | "completed"
>;

function haveSameSets(previous: WorkoutSetForComparison[], current: WorkoutSetForComparison[]) {
	return (
		previous.length === current.length &&
		previous.every((set, index) => {
			const next = current[index];

			return (
				next !== undefined &&
				set.id === next.id &&
				set.weight === next.weight &&
				set.reps === next.reps &&
				set.completed === next.completed
			);
		})
	);
}

function groupPrSetsByExercise(
	exercises: { exerciseId: string; sets: WorkoutSetForComparison[] }[],
) {
	const setsByExerciseId = new Map<string, WorkoutSetForComparison[]>();

	for (const exercise of exercises) {
		const sets = setsByExerciseId.get(exercise.exerciseId) ?? [];
		sets.push(...exercise.sets);
		setsByExerciseId.set(exercise.exerciseId, sets);
	}

	return setsByExerciseId;
}

export function getWorkoutExerciseChanges({
	previous,
	current,
}: {
	previous: StoredWorkoutExercise[];
	current: WorkoutExerciseWithDatabaseId[];
}) {
	const hasExerciseChanges =
		previous.length !== current.length ||
		previous.some((exercise, index) => {
			const next = current[index];

			return (
				next === undefined ||
				exercise.id !== next.id ||
				exercise.exerciseId !== next.exerciseId ||
				exercise.difficulty !== (next.difficulty ?? null) ||
				exercise.notes !== (next.notes ?? "") ||
				!haveSameSets(exercise.sets, next.sets)
			);
		});

	if (!hasExerciseChanges) return { hasExerciseChanges, affectedExerciseIds: [] };

	// Only ordering within the same catalog exercise can change its PR history.
	const previousSets = groupPrSetsByExercise(previous);
	const currentSets = groupPrSetsByExercise(current);
	const exerciseIds = new Set([...previousSets.keys(), ...currentSets.keys()]);

	const affectedExerciseIds = [...exerciseIds].filter(
		(exerciseId) =>
			!haveSameSets(previousSets.get(exerciseId) ?? [], currentSets.get(exerciseId) ?? []),
	);

	return { hasExerciseChanges, affectedExerciseIds };
}

export function getMissingExercises({
	exercises,
	storedExercises,
}: {
	exercises: PreparedWorkoutWriteExercise[];
	storedExercises: readonly StoredExercise[];
}) {
	const unique = new Map(
		exercises.toReversed().map(({ global }) => [global.normalizedName, global]),
	);

	const storedNames = new Set(storedExercises.map((exercise) => exercise.normalizedName));

	return [...unique.values()].filter((exercise) => !storedNames.has(exercise.normalizedName));
}

export function attachExerciseIdsToWorkout({
	exercises,
	storedExercises,
}: {
	exercises: PreparedWorkoutWriteExercise[];
	storedExercises: readonly StoredExercise[];
}) {
	const idsByName = new Map(
		storedExercises.map((exercise) => [exercise.normalizedName, exercise.id]),
	);

	return Effect.forEach(exercises, (exercise) => {
		const exerciseId = idsByName.get(exercise.global.normalizedName);

		if (exerciseId === undefined) {
			return Effect.fail(
				new DatabaseError({ cause: new Error("Exercise was not found after the insert") }),
			);
		}

		return Effect.succeed({ ...exercise, exerciseId });
	});
}
