import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import { transactions } from "@/server/transactions";
import { workoutHistoryDb } from "@/features/workout-history/server/workout-history.db";
import { workoutDb } from "@/features/workout-form/server/workouts.db";
import {
	deleteAllWorkouts,
	deleteWorkout,
	listWorkouts,
} from "@/features/workout-history/server/workout-history.service";

const deleteWorkoutInputSchema = z.object({ workoutId: z.uuid() }).strict();

const deleteWorkoutOutputSchema = z
	.object({
		deletedWorkoutId: z.uuid(),
		deletedWorkoutName: z.string(),
	})
	.strict();

const deleteAllWorkoutsOutputSchema = z
	.object({
		deletedCount: z.number().int().positive(),
	})
	.strict();

const historyInputSchema = z.object({
	limit: z.number().int().min(1).max(25),
	offset: z.number().int().nonnegative(),
});

const historyItemSchema = z.object({
	id: z.uuid(),
	createdAt: z.number(),
	name: z.string(),
	durationSeconds: z.number().nullable(),
	totalVolume: z.number(),
	totalPrSets: z.number(),
	exerciseCount: z.number(),
	muscleGroups: z.array(z.string()),
});

const historySchema = z.object({
	items: z.array(historyItemSchema),
	nextOffset: z.number().int().nonnegative().nullable(),
});

export const workoutHistoryRouter = {
	deleteAll: protectedProcedure
		.errors({
			NO_WORKOUTS: {
				message: "No workouts were found",
			},
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(z.object({}).strict())
		.output(deleteAllWorkoutsOutputSchema)
		.handler(({ context, errors }) =>
			Effect.runPromise(
				deleteAllWorkouts(context.userId).pipe(
					Effect.provide(workoutDb),
					Effect.catchTags({
						NO_WORKOUTS: () => Effect.fail(errors.NO_WORKOUTS()),
						DatabaseError: (error) =>
							logDatabaseError(
								"Failed to delete all workouts",
								error.cause,
								errors.DATABASE_ERROR(),
							),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	delete: protectedProcedure
		.errors({
			NOT_FOUND: {
				message: "The requested workout was not found",
			},
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(deleteWorkoutInputSchema)
		.output(deleteWorkoutOutputSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				deleteWorkout(input.workoutId, context.userId).pipe(
					Effect.provide(transactions),
					Effect.map((workout) => ({
						deletedWorkoutId: workout.id,
						deletedWorkoutName: workout.name,
					})),
					Effect.catchTags({
						NOT_FOUND: () => Effect.fail(errors.NOT_FOUND()),
						DatabaseError: (error) =>
							logDatabaseError("Failed to delete workout", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	list: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(historyInputSchema)
		.output(historySchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				listWorkouts({ ...input, userId: context.userId }).pipe(
					Effect.provide(workoutHistoryDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to list workouts", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
};
