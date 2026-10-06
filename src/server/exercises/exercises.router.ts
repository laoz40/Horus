import "server-only";

import { z } from "zod";
import { MUSCLE_GROUP_CATEGORIES } from "@/features/workout-form/lib/muscleGroupCategories";
import { protectedProcedure } from "@/server/procedures";
import { exercisesProgressProcedures } from "@/server/exercises/progress/progress.router";
import { checkSetPr } from "@/server/exercises/progress/progress.service";
import {
	createUserExercise,
	normalizeExerciseInput,
	validateExerciseNameAvailability,
	getUserExercise,
	getUnusedUserExercise,
	deleteUserExerciseById,
	listExercisesByCategory,
	listUserExercises,
	mergeUserExercises,
	searchExercises,
	updateUserExercise,
} from "@/server/exercises/library/library.service";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

const exerciseLibraryErrors = {
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

const exerciseLibraryWriteInputSchema = z
	.object({
		name: z.string().trim().min(1),
		muscleGroups: z.array(z.string()),
	})
	.strict();

const exerciseLibraryItemSchema = z
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
					exercises: z.array(exerciseLibraryItemSchema),
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
		})
		.input(exerciseLibraryWriteInputSchema)
		.output(
			z
				.object({
					exercise: exerciseLibraryItemSchema,
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const normalizedExercise = normalizeExerciseInput(input);

			const result = await validateExerciseNameAvailability({
				userId: context.userId,
				normalizedName: normalizedExercise.normalizedName,
			})
				.andThen(() => createUserExercise({ userId: context.userId, exercise: normalizedExercise }))
				.map((exercise) => ({ exercise }));

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
					exercise: exerciseLibraryItemSchema,
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const normalizedExercise = normalizeExerciseInput(input);

			const result = await getUserExercise(context.userId, input.id)
				.andThen(() =>
					validateExerciseNameAvailability({
						userId: context.userId,
						normalizedName: normalizedExercise.normalizedName,
						excludingExerciseId: input.id,
					}),
				)
				.andThen(() =>
					updateUserExercise({
						userId: context.userId,
						exerciseId: input.id,
						exercise: normalizedExercise,
					}),
				)
				.map((exercise) => ({ exercise }));

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
			DATABASE_ERROR: exerciseLibraryErrors.DATABASE_ERROR,
			EXERCISE_NOT_FOUND: exerciseLibraryErrors.EXERCISE_NOT_FOUND,
			EXERCISE_IN_USE: exerciseLibraryErrors.EXERCISE_IN_USE,
		})
		.input(z.object({ id: z.uuid() }).strict())
		.output(z.object({ deleted: z.literal(true) }).strict())
		.handler(async ({ input, context, errors }) => {
			const result = await getUnusedUserExercise(context.userId, input.id).andThen((exercise) =>
				deleteUserExerciseById(context.userId, exercise.id),
			);

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
	merge: protectedProcedure
		.errors({
			DATABASE_ERROR: exerciseLibraryErrors.DATABASE_ERROR,
			EXERCISE_NOT_FOUND: exerciseLibraryErrors.EXERCISE_NOT_FOUND,
		})
		.input(
			z
				.object({
					sourceId: z.uuid(),
					targetId: z.uuid(),
					sourceMuscleGroups: z.array(z.string()).optional(),
				})
				.strict(),
		)
		.output(
			z
				.object({
					targetExercise: exerciseLibraryItemSchema,
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await mergeUserExercises(context.userId, input);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "EXERCISE_NOT_FOUND":
							throw errors.EXERCISE_NOT_FOUND();
						case "DATABASE_ERROR":
							console.error("Failed to merge exercises", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	...exercisesProgressProcedures,
};
