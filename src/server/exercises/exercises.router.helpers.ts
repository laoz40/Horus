import "server-only";

import { z } from "zod";

export const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const onlineExerciseSearchErrors = {
	RATE_LIMITED: {
		message: "Too many requests. Please try again later.",
	},
	REQUEST_FAILED: {
		message: "Failed to fetch exercises.",
	},
};

export const onlineExerciseSuggestionsSchema = z.array(
	z
		.object({
			id: z.string(),
			name: z.string(),
			normalizedName: z.string(),
			muscleGroups: z.array(z.string()).optional(),
		})
		.strict(),
);

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
