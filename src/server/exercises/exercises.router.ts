import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Database } from "@/lib/db/database";
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
import {
	databaseError,
	exerciseCatalogItemsSchema,
	exerciseLibraryErrors,
	exerciseLibraryItemSchema,
	exerciseLibraryWriteOutputSchema,
	exerciseLibraryWriteProcedureErrors,
	matchDatabaseResult,
	matchExerciseLibraryWriteResult,
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
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (exercises) => ({ exercises }),
						onFailure: (error) => {
							console.error("Failed to list exercises", { cause: error.cause });

							throw errors.DATABASE_ERROR();
						},
					}),
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
		.handler(async ({ input, context, errors }) => {
			const result = await checkSetPr({
				userId: context.userId,
				exerciseName: input.exerciseName,
				sets: input.sets,
				setIndex: input.setIndex,
			});

			return matchDatabaseResult(result, errors, "Failed to check set PR");
		}),
	search: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				query: z.string(),
			}),
		)
		.output(exerciseCatalogItemsSchema)
		.handler(async ({ input, context, errors }) => {
			const result = await searchExercises(context.userId, input.query);

			return matchDatabaseResult(result, errors, "Failed to search exercises");
		}),
	listByCategory: protectedProcedure
		.errors(databaseError)
		.input(
			z.object({
				category: z.enum(MUSCLE_GROUP_CATEGORIES),
			}),
		)
		.output(exerciseCatalogItemsSchema)
		.handler(async ({ input, context, errors }) => {
			const result = await listExercisesByCategory(context.userId, input.category);

			return matchDatabaseResult(result, errors, "Failed to list exercises by category");
		}),
	create: protectedProcedure
		.errors(exerciseLibraryWriteProcedureErrors)
		.input(exerciseLibraryWriteInputSchema)
		.output(exerciseLibraryWriteOutputSchema)
		.handler(async ({ input, context, errors }) => {
			const normalizedExercise = normalizeExerciseInput(input);

			const result = await validateExerciseNameAvailability({
				userId: context.userId,
				normalizedName: normalizedExercise.normalizedName,
			})
				.andThen(() => createUserExercise({ userId: context.userId, exercise: normalizedExercise }))
				.map((exercise) => ({ exercise }));

			return matchExerciseLibraryWriteResult(result, errors, "Failed to create exercise");
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

			return matchExerciseLibraryWriteResult(result, errors, "Failed to update exercise");
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
