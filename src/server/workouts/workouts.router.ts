import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { WorkoutForSaveSchema } from "@/features/workout-form/lib/validateWorkout";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import { transactions } from "@/server/transactions";
import { workoutDb } from "@/server/workouts/workouts.db";
import {
	createWorkout,
	deleteAllWorkouts,
	deleteWorkout,
	getWorkoutById,
	listWorkouts,
	updateWorkout,
} from "@/server/workouts/workouts.service";

const workoutFormSchema = z.object({
	name: z.string(),
	createdAt: z.number(),
	durationSeconds: z.number().int().nullable(),
	exercises: z.array(
		z.object({
			id: z.uuid(),
			exerciseId: z.uuid(),
			global: z.object({
				name: z.string(),
				muscleGroups: z.array(z.string()),
			}),
			difficulty: z.number().optional(),
			notes: z.string().optional(),
			sets: z.array(
				z.object({
					id: z.uuid(),
					weight: z.number(),
					reps: z.number(),
					completed: z.boolean(),
					prTypes: z.array(z.enum(["weight", "volume", "bodyweightReps"])).optional(),
				}),
			),
		}),
	),
});

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

export const workoutsRouter = {
	create: createWorkoutProcedure.handler(({ input, context, errors }) =>
		Effect.runPromise(
			createWorkout({ userId: context.userId, workout: input.workout }).pipe(
				Effect.map((workoutId) => ({ workoutId, workout: input.workout })),
				Effect.provide(transactions),
				Effect.catchTags({
					INVALID_INPUT: () => Effect.fail(errors.INVALID_INPUT()),
					DatabaseError: (error) =>
						logDatabaseError("Failed to create workout", error.cause, errors.DATABASE_ERROR()),
				}),
				Effect.annotateLogs(context.logAnnotations),
			),
		),
	),
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
	update: updateWorkoutProcedure.handler(({ input, context, errors }) =>
		Effect.runPromise(
			updateWorkout({
				workoutId: input.workoutId,
				userId: context.userId,
				workout: input.workout,
			}).pipe(
				Effect.map((workoutId) => ({ workoutId, workout: input.workout })),
				Effect.provide(transactions),
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
	getById: protectedProcedure
		.errors({
			NOT_FOUND: {
				message: "The requested resource was not found",
			},
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(z.object({ id: z.uuid() }))
		.output(workoutFormSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				getWorkoutById(input.id, context.userId).pipe(
					Effect.provide(workoutDb),
					Effect.catchTags({
						NOT_FOUND: () => Effect.fail(errors.NOT_FOUND()),
						DatabaseError: (error) =>
							logDatabaseError("Failed to load workout", error.cause, errors.DATABASE_ERROR()),
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
					Effect.provide(workoutDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to list workouts", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
};
