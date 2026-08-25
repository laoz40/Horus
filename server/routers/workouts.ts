import "server-only";

import { z } from "zod";
import { WorkoutForSaveSchema } from "@/features/workout-form/lib/validateWorkout";
import { protectedProcedure } from "@/server/procedures";
import {
	createWorkout,
	deleteAllWorkouts,
	deleteWorkout,
	getWorkoutById,
	listWorkouts,
	updateWorkout,
} from "@/server/services/workouts.service";

const workoutFormSchema = z.object({
	name: z.string(),
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
	_id: z.uuid(),
	_creationTime: z.number(),
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
	create: createWorkoutProcedure.handler(async ({ input, context, errors }) => {
		const result = await createWorkout(context.userId, input.workout);

		return result.match(
			(value) => value,
			(error) => {
				const reason = error.reason;

				switch (reason) {
					case "INVALID_INPUT":
						throw errors.INVALID_INPUT();
					case "DATABASE_ERROR":
						console.error("Failed to create workout", { cause: error.cause });
						throw errors.DATABASE_ERROR();
					default: {
						const exhaustiveReason: never = reason;
						throw exhaustiveReason;
					}
				}
			},
		);
	}),
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
		.handler(async ({ context, errors }) => {
			const result = await deleteAllWorkouts(context.userId);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "NO_WORKOUTS":
							throw errors.NO_WORKOUTS();
						case "DATABASE_ERROR":
							console.error("Failed to delete all workouts", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
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
		.handler(async ({ input, context, errors }) => {
			const result = await deleteWorkout(input.workoutId, context.userId);

			return result.match(
				(workout) => ({
					deletedWorkoutId: workout.id,
					deletedWorkoutName: workout.name,
				}),
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "NOT_FOUND":
							throw errors.NOT_FOUND();
						case "DATABASE_ERROR":
							console.error("Failed to delete workout", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	update: updateWorkoutProcedure.handler(async ({ input, context, errors }) => {
		const result = await updateWorkout(input.workoutId, context.userId, input.workout);

		return result.match(
			(value) => value,
			(error) => {
				const reason = error.reason;

				switch (reason) {
					case "NOT_FOUND":
						throw errors.NOT_FOUND();
					case "INVALID_INPUT":
						throw errors.INVALID_INPUT();
					case "DATABASE_ERROR":
						console.error("Failed to update workout", { cause: error.cause });
						throw errors.DATABASE_ERROR();
					default: {
						const exhaustiveReason: never = reason;
						throw exhaustiveReason;
					}
				}
			},
		);
	}),
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
		.handler(async ({ input, context, errors }) => {
			const result = await getWorkoutById(input.id, context.userId);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "NOT_FOUND":
							throw errors.NOT_FOUND();
						case "DATABASE_ERROR":
							console.error("Failed to load workout", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	list: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(historyInputSchema)
		.output(historySchema)
		.handler(async ({ input, context, errors }) => {
			const result = await listWorkouts({ ...input, userId: context.userId });

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to list workouts", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
};
