import { transactions } from "@/server/transactions";
import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { MUSCLE_GROUP_CATEGORIES } from "@/features/workout-form/lib/muscleGroupCategories";
import { fetchApiExercises } from "@/features/workout-form/lib/fetchApiExercises.server";
import { protectedProcedure, publicProcedure } from "@/server/procedures";
import { exercisesProgressProcedures } from "@/server/exercises/progress/progress.router";
import { progressDb } from "@/server/exercises/progress/progress.db";
import { exerciseDb } from "@/server/exercises/library/exercises.db";
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
import {
	databaseError,
	exerciseCatalogItemsSchema,
	exerciseLibraryErrors,
	exerciseLibraryItemSchema,
	exerciseLibraryWriteOutputSchema,
	exerciseLibraryWriteProcedureErrors,
	onlineExerciseSearchErrors,
	onlineExerciseSuggestionsSchema,
} from "@/server/exercises/exercises.router.helpers";

const exerciseLibraryWriteInputSchema = z
	.object({
		name: z.string().trim().min(1),
		muscleGroups: z.array(z.string()),
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
		.handler(({ context, errors }) =>
			Effect.runPromise(
				listUserExercises(context.userId).pipe(
					Effect.provide(exerciseDb),
					Effect.map((exercises) => ({ exercises })),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to list exercises", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
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
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				checkSetPr({
					userId: context.userId,
					exerciseName: input.exerciseName,
					sets: input.sets,
					setIndex: input.setIndex,
				}).pipe(
					Effect.provide(progressDb),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to check set PR", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	search: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				query: z.string(),
			}),
		)
		.output(exerciseCatalogItemsSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				searchExercises(context.userId, input.query).pipe(
					Effect.provide(exerciseDb),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to search exercises", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	searchOnline: publicProcedure
		.errors(onlineExerciseSearchErrors)
		.input(z.object({ query: z.string().trim().min(1) }).strict())
		.output(onlineExerciseSuggestionsSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				fetchApiExercises(input.query).pipe(
					Effect.catchTags({
						RATE_LIMITED: () => Effect.fail(errors.RATE_LIMITED()),
						REQUEST_FAILED: () => Effect.fail(errors.REQUEST_FAILED()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	listByCategory: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				category: z.enum(MUSCLE_GROUP_CATEGORIES),
			}),
		)
		.output(exerciseCatalogItemsSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				listExercisesByCategory(context.userId, input.category).pipe(
					Effect.provide(exerciseDb),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to list exercises by category", {
								cause: error.cause,
							}).pipe(Effect.andThen(Effect.fail(errors.DATABASE_ERROR())));
						},
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	create: protectedProcedure
		.errors(exerciseLibraryWriteProcedureErrors)
		.input(exerciseLibraryWriteInputSchema)
		.output(exerciseLibraryWriteOutputSchema)
		.handler(({ input, context, errors }) => {
			const normalizedExercise = normalizeExerciseInput(input);

			return Effect.runPromise(
				Effect.gen(function* () {
					yield* validateExerciseNameAvailability({
						userId: context.userId,
						normalizedName: normalizedExercise.normalizedName,
					});

					const exercise = yield* createUserExercise({
						userId: context.userId,
						exercise: normalizedExercise,
					});

					return { exercise };
				}).pipe(
					Effect.provide(exerciseDb),
					Effect.provide(transactions),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to create exercise", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
						ExerciseNameCollisionError: (error) =>
							Effect.fail(
								errors.NAME_COLLISION({
									data: { existingExercise: error.existingExercise },
								}),
							),
						ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			);
		}),
	update: protectedProcedure
		.errors(exerciseLibraryWriteProcedureErrors)
		.input(
			z
				.object({
					id: z.uuid(),
					name: z.string().trim().min(1),
					muscleGroups: z.array(z.string()),
				})
				.strict(),
		)
		.output(exerciseLibraryWriteOutputSchema)
		.handler(({ input, context, errors }) => {
			const normalizedExercise = normalizeExerciseInput(input);

			return Effect.runPromise(
				Effect.gen(function* () {
					yield* getUserExercise(context.userId, input.id);
					yield* validateExerciseNameAvailability({
						userId: context.userId,
						normalizedName: normalizedExercise.normalizedName,
						excludingExerciseId: input.id,
					});

					const exercise = yield* updateUserExercise({
						userId: context.userId,
						exerciseId: input.id,
						exercise: normalizedExercise,
					});

					return { exercise };
				}).pipe(
					Effect.provide(exerciseDb),
					Effect.provide(transactions),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to update exercise", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
						ExerciseNameCollisionError: (error) =>
							Effect.fail(
								errors.NAME_COLLISION({
									data: { existingExercise: error.existingExercise },
								}),
							),
						ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
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
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				Effect.gen(function* () {
					const exercise = yield* getUnusedUserExercise(context.userId, input.id);

					return yield* deleteUserExerciseById(context.userId, exercise.id);
				}).pipe(
					Effect.provide(exerciseDb),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to delete exercise", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
						ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
						ExerciseInUseError: () => Effect.fail(errors.EXERCISE_IN_USE()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
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
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				mergeUserExercises(context.userId, input).pipe(
					Effect.provide(exerciseDb),
					Effect.provide(transactions),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to merge exercises", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
						ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	...exercisesProgressProcedures,
};
