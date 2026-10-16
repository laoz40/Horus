import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import type { ExerciseNameCollisionError } from "@/features/exercise-library/server/library.functions";

export const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const exerciseLibraryErrors = {
	...databaseError,
	NAME_COLLISION: {
		message: "An exercise with this name already exists",
	},
	EXERCISE_NOT_FOUND: {
		message: "The exercise was not found",
	},
	EXERCISE_IN_USE: {
		message: "This exercise is used in workouts and cannot be deleted",
	},
};

export const exerciseLibraryItemSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		muscleGroups: z.array(z.string()),
		workoutCount: z.number().int().nonnegative(),
	})
	.strict();

export const exerciseLibraryWriteOutputSchema = z
	.object({
		exercise: exerciseLibraryItemSchema,
	})
	.strict();

export const exerciseLibraryWriteProcedureErrors = {
	DATABASE_ERROR: exerciseLibraryErrors.DATABASE_ERROR,
	EXERCISE_NOT_FOUND: exerciseLibraryErrors.EXERCISE_NOT_FOUND,
	NAME_COLLISION: {
		message: exerciseLibraryErrors.NAME_COLLISION.message,
		data: z
			.object({
				existingExercise: exerciseLibraryItemSchema,
			})
			.strict(),
	},
};

export function exerciseLibraryWriteErrorHandlers<NameCollisionError, NotFoundError>(errors: {
	NAME_COLLISION: (options: {
		data: { existingExercise: InstanceType<typeof ExerciseNameCollisionError>["existingExercise"] };
	}) => NameCollisionError;
	EXERCISE_NOT_FOUND: () => NotFoundError;
}) {
	return {
		ExerciseNameCollisionError: (error: ExerciseNameCollisionError) =>
			Effect.fail(errors.NAME_COLLISION({ data: { existingExercise: error.existingExercise } })),
		ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
	};
}
