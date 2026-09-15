import "server-only";

import { z } from "zod";
import { MUSCLE_GROUP_CATEGORIES } from "@/features/workout-form/lib/muscleGroupCategories";
import { protectedProcedure } from "@/server/procedures";
import {
	checkSetPr,
	createUserExercise,
	deleteUserExerciseById,
	getRecentSets,
	listExercisesByCategory,
	listUserExercises,
	searchExercises,
	updateUserExercise,
} from "@/server/services/exercises.service";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

const exerciseCatalogErrors = {
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

const exerciseCatalogWriteInputSchema = z
	.object({
		name: z.string().trim().min(1),
		muscleGroups: z.array(z.string()),
	})
	.strict();

const exerciseCatalogItemSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		muscleGroups: z.array(z.string()),
		workoutCount: z.number().int().nonnegative(),
	})
	.strict();

export const exercisesRouter = {
	list: protectedProcedure
		.errors(databaseError)
		.output(
			z
				.object({
					exercises: z.array(exerciseCatalogItemSchema),
				})
				.strict(),
		)
		.handler(async ({ context, errors }) => {
			const result = await listUserExercises(context.userId);

			return result.match(
				(exercises) => ({ exercises }),
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to list exercises", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	checkSetPr: protectedProcedure
		.errors(databaseError)
		.input(
			z
				.object({
					exerciseName: z.string().trim().min(1),
					sets: z.array(
						z
							.object({
								completed: z.boolean(),
								weight: z.number().nonnegative().optional(),
								reps: z.number().int().positive().optional(),
							})
							.strict(),
					),
					setIndex: z.number().int().nonnegative(),
				})
				.strict(),
		)
		.output(
			z
				.object({
					prType: z.enum(["weight", "volume", "bodyweightReps"]).nullable(),
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await checkSetPr({
				userId: context.userId,
				exerciseName: input.exerciseName,
				sets: input.sets,
				setIndex: input.setIndex,
			});

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to check set PR", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	search: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				query: z.string(),
			}),
		)
		.output(
			z.array(
				z.object({
					id: z.uuid(),
					name: z.string(),
					normalizedName: z.string(),
					muscleGroups: z.array(z.string()),
				}),
			),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await searchExercises(context.userId, input.query);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to search exercises", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	listByCategory: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				category: z.enum(MUSCLE_GROUP_CATEGORIES),
			}),
		)
		.output(
			z.array(
				z.object({
					id: z.uuid(),
					name: z.string(),
					normalizedName: z.string(),
					muscleGroups: z.array(z.string()),
				}),
			),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await listExercisesByCategory(context.userId, input.category);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to list exercises by category", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	create: protectedProcedure
		.errors({
			DATABASE_ERROR: exerciseCatalogErrors.DATABASE_ERROR,
			EXERCISE_NOT_FOUND: exerciseCatalogErrors.EXERCISE_NOT_FOUND,
			NAME_COLLISION: {
				message: exerciseCatalogErrors.NAME_COLLISION.message,
				data: z
					.object({
						existingExercise: exerciseCatalogItemSchema,
					})
					.strict(),
			},
		})
		.input(exerciseCatalogWriteInputSchema)
		.output(
			z
				.object({
					exercise: exerciseCatalogItemSchema,
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await createUserExercise(context.userId, input);

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
							console.error("Failed to create exercise", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	update: protectedProcedure
		.errors({
			DATABASE_ERROR: exerciseCatalogErrors.DATABASE_ERROR,
			EXERCISE_NOT_FOUND: exerciseCatalogErrors.EXERCISE_NOT_FOUND,
			NAME_COLLISION: {
				message: exerciseCatalogErrors.NAME_COLLISION.message,
				data: z
					.object({
						existingExercise: exerciseCatalogItemSchema,
					})
					.strict(),
			},
		})
		.input(
			z
				.object({
					id: z.uuid(),
					name: z.string().trim().min(1),
					muscleGroups: z.array(z.string()),
				})
				.strict(),
		)
		.output(
			z
				.object({
					exercise: exerciseCatalogItemSchema,
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await updateUserExercise(context.userId, input);

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
							console.error("Failed to update exercise", { cause: error.cause });
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
			DATABASE_ERROR: exerciseCatalogErrors.DATABASE_ERROR,
			EXERCISE_NOT_FOUND: exerciseCatalogErrors.EXERCISE_NOT_FOUND,
			EXERCISE_IN_USE: exerciseCatalogErrors.EXERCISE_IN_USE,
		})
		.input(z.object({ id: z.uuid() }).strict())
		.output(z.object({ deleted: z.literal(true) }).strict())
		.handler(async ({ input, context, errors }) => {
			const result = await deleteUserExerciseById(context.userId, input.id);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "EXERCISE_NOT_FOUND":
							throw errors.EXERCISE_NOT_FOUND();
						case "EXERCISE_IN_USE":
							throw errors.EXERCISE_IN_USE();
						case "DATABASE_ERROR":
							console.error("Failed to delete exercise", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	recentSets: protectedProcedure
		.errors(databaseError)
		.input(z.object({ exerciseName: z.string().trim().min(1) }).strict())
		.output(
			z.array(
				z
					.object({
						id: z.uuid(),
						weight: z.number(),
						reps: z.number(),
						completedAtMs: z.number(),
						isPr: z.boolean(),
						prTypes: z.array(z.enum(["weight", "volume", "bodyweightReps"])),
					})
					.strict(),
			),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await getRecentSets(context.userId, input.exerciseName);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to get recent sets", { cause: error.cause });
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
