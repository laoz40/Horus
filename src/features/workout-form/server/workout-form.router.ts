import { database } from "@/server/database";
import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { WorkoutForSaveSchema } from "@/features/workout-form/lib/validateWorkout";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import { createWorkout, updateWorkout } from "@/features/workout-form/server/workout-form.service";

const createWorkoutInputSchema = z
	.object({
		workout: WorkoutForSaveSchema,
	})
	.strict();

const updateWorkoutInputSchema = z
	.object({
		workoutId: z.uuid(),
		workout: WorkoutForSaveSchema,
	})
	.strict();

const workoutSaveOutputSchema = z
	.object({
		workoutId: z.uuid(),
		workout: WorkoutForSaveSchema,
	})
	.strict();

const createWorkoutProcedure = protectedProcedure
	.errors({
		INVALID_INPUT: {
			message: "The workout contains invalid identifiers",
		},
		DATABASE_ERROR: {
			message: "The database operation failed",
		},
	})
	.input(createWorkoutInputSchema)
	.output(workoutSaveOutputSchema);

const updateWorkoutProcedure = protectedProcedure
	.errors({
		INVALID_INPUT: {
			message: "The workout update contains invalid identifiers",
		},
		NOT_FOUND: {
			message: "The requested resource was not found",
		},
		DATABASE_ERROR: {
			message: "The database operation failed",
		},
	})
	.input(updateWorkoutInputSchema)
	.output(workoutSaveOutputSchema);

export const workoutFormRouter = {
	create: createWorkoutProcedure.handler(({ input, context, errors }) =>
		Effect.runPromise(
			createWorkout({ userId: context.userId, workout: input.workout }).pipe(
				Effect.map((workoutId) => ({ workoutId, workout: input.workout })),
				Effect.provide(database),
				Effect.catchTags({
					INVALID_INPUT: () => Effect.fail(errors.INVALID_INPUT()),
					DatabaseError: (error) =>
						logDatabaseError("Failed to create workout", error.cause, errors.DATABASE_ERROR()),
				}),
				Effect.annotateLogs(context.logAnnotations),
			),
		),
	),
	update: updateWorkoutProcedure.handler(({ input, context, errors }) =>
		Effect.runPromise(
			updateWorkout({
				workoutId: input.workoutId,
				userId: context.userId,
				workout: input.workout,
			}).pipe(
				Effect.map((workoutId) => ({ workoutId, workout: input.workout })),
				Effect.provide(database),
				Effect.catchTags({
					NOT_FOUND: () => Effect.fail(errors.NOT_FOUND()),
					INVALID_INPUT: () => Effect.fail(errors.INVALID_INPUT()),
					DatabaseError: (error) =>
						logDatabaseError("Failed to update workout", error.cause, errors.DATABASE_ERROR()),
				}),
				Effect.annotateLogs(context.logAnnotations),
			),
		),
	),
};
