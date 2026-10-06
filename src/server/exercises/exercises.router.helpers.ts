import "server-only";

import type { Result } from "neverthrow";
import { z } from "zod";

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

const exerciseCatalogItemSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	normalizedName: z.string(),
	muscleGroups: z.array(z.string()),
});

export const exerciseCatalogItemsSchema = z.array(exerciseCatalogItemSchema);

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

type DatabaseError = { reason: "DATABASE_ERROR"; cause: unknown };

type ExerciseLibraryWriteError =
	| { reason: "NAME_COLLISION"; existingExercise: z.infer<typeof exerciseLibraryItemSchema> }
	| { reason: "EXERCISE_NOT_FOUND" }
	| DatabaseError;

interface DatabaseProcedureErrors {
	DATABASE_ERROR: () => Error;
}

interface ExerciseLibraryWriteProcedureErrors {
	NAME_COLLISION: (input: {
		data: { existingExercise: z.infer<typeof exerciseLibraryItemSchema> };
	}) => Error;
	EXERCISE_NOT_FOUND: () => Error;
	DATABASE_ERROR: () => Error;
}

export function matchDatabaseResult<T>(
	result: Result<T, DatabaseError>,
	errors: DatabaseProcedureErrors,
	logLabel: string,
): T {
	return result.match(
		(value) => value,
		(error) => {
			const reason = error.reason;

			switch (reason) {
				case "DATABASE_ERROR":
					console.error(logLabel, { cause: error.cause });
					throw errors.DATABASE_ERROR();
				default: {
					const exhaustiveReason: never = reason;
					throw exhaustiveReason;
				}
			}
		},
	);
}

export function matchExerciseLibraryWriteResult<T>(
	result: Result<T, ExerciseLibraryWriteError>,
	errors: ExerciseLibraryWriteProcedureErrors,
	logLabel: string,
): T {
	return result.match(
		(value) => value,
		(error) => {
			const reason = error.reason;

			switch (reason) {
				case "NAME_COLLISION":
					throw errors.NAME_COLLISION({
						data: { existingExercise: error.existingExercise },
					});
				case "EXERCISE_NOT_FOUND":
					throw errors.EXERCISE_NOT_FOUND();
				case "DATABASE_ERROR":
					console.error(logLabel, { cause: error.cause });
					throw errors.DATABASE_ERROR();
				default: {
					const exhaustiveReason: never = reason;
					throw exhaustiveReason;
				}
			}
		},
	);
}
