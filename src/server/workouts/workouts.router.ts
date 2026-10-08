import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { WorkoutForSaveSchema } from "@/features/workout-form/lib/validateWorkout";
import { prisma } from "@/lib/db";
import { Database } from "@/lib/db/database";
import { protectedProcedure } from "@/server/procedures";
import {
	createWorkout,
	deleteAllWorkouts,
	deleteWorkout,
	getWorkoutById,
	listWorkouts,
	validateAndNormalizeWorkout,
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
			Effect.gen(function* () {
				const workout = yield* validateAndNormalizeWorkout(input.workout);
				const workoutId = yield* createWorkout({ userId: context.userId, workout });

				return { workoutId, workout: input.workout };
			}).pipe(
				Effect.provideService(Database, { prisma }),
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						if ("reason" in error) {
							switch (error.reason) {
								case "INVALID_INPUT":
									throw errors.INVALID_INPUT();
								default:
									throw errors.DATABASE_ERROR();
							}
						}

						console.error("Failed to create workout", { cause: error.cause });
						throw errors.DATABASE_ERROR();
					},
				}),
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
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (value) => value,
						onFailure: (error) => {
							if ("reason" in error) {
								switch (error.reason) {
									case "NO_WORKOUTS":
										throw errors.NO_WORKOUTS();
									default: {
										const exhaustiveReason: never = error.reason;
										throw exhaustiveReason;
									}
								}
							}

							console.error("Failed to delete all workouts", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						},
					}),
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
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (workout) => ({
							deletedWorkoutId: workout.id,
							deletedWorkoutName: workout.name,
						}),
						onFailure: (error) => {
							if ("reason" in error) {
								switch (error.reason) {
									case "NOT_FOUND":
										throw errors.NOT_FOUND();
									default: {
										const exhaustiveReason: never = error.reason;
										throw exhaustiveReason;
									}
								}
							}

							console.error("Failed to delete workout", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						},
					}),
				),
			),
		),
	update: updateWorkoutProcedure.handler(({ input, context, errors }) =>
		Effect.runPromise(
			Effect.gen(function* () {
				const workout = yield* validateAndNormalizeWorkout(input.workout);
				yield* updateWorkout({ workoutId: input.workoutId, userId: context.userId, workout });

				return { workoutId: input.workoutId, workout: input.workout };
			}).pipe(
				Effect.provideService(Database, { prisma }),
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						if ("reason" in error) {
							switch (error.reason) {
								case "NOT_FOUND":
									throw errors.NOT_FOUND();
								case "INVALID_INPUT":
									throw errors.INVALID_INPUT();
								default:
									throw errors.DATABASE_ERROR();
							}
						}

						console.error("Failed to update workout", { cause: error.cause });
						throw errors.DATABASE_ERROR();
					},
				}),
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
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (value) => value,
						onFailure: (error) => {
							if ("reason" in error) {
								switch (error.reason) {
									case "NOT_FOUND":
										throw errors.NOT_FOUND();
									default: {
										const exhaustiveReason: never = error.reason;
										throw exhaustiveReason;
									}
								}
							}

							console.error("Failed to load workout", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						},
					}),
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
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (value) => value,
						onFailure: (error) => {
							console.error("Failed to list workouts", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						},
					}),
				),
			),
		),
};
