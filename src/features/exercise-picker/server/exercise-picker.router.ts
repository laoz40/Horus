import { database } from "@/server/database";
import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { MUSCLE_GROUP_CATEGORIES } from "@/features/exercise-library/lib/muscleGroupCategories";
import { fetchApiExercises } from "@/features/exercise-picker/server/fetchApiExercises.server";
import { logDatabaseError, protectedProcedure, publicProcedure } from "@/server/procedures";
import { databaseError } from "@/features/exercise-library/server/exercise-library.router.helpers";
import {
	listExercisesByCategory,
	searchExercises,
} from "@/features/exercise-picker/server/exercise-picker.service";
import {
	exerciseCatalogItemsSchema,
	onlineExerciseSearchErrors,
	onlineExerciseSuggestionsSchema,
} from "@/features/exercise-picker/server/exercise-picker.router.helpers";

export const exercisePickerRouter = {
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
					Effect.provide(database),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to search exercises", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	searchOnline: publicProcedure
		.errors(onlineExerciseSearchErrors)
		.input(z.object({ query: z.string().trim().min(1) }).strict())
		.output(onlineExerciseSuggestionsSchema)
		.handler(({ input, context, errors, signal }) =>
			Effect.runPromise(
				fetchApiExercises(input.query).pipe(
					Effect.catchTags({
						RATE_LIMITED: () => Effect.fail(errors.RATE_LIMITED()),
						REQUEST_FAILED: (error) => {
							return Effect.logError("Failed to fetch online exercises", {
								reason: error.reason,
								cause: error.cause,
							}).pipe(Effect.andThen(Effect.fail(errors.REQUEST_FAILED())));
						},
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
				{ signal },
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
					Effect.provide(database),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError(
								"Failed to list exercises by category",
								error.cause,
								errors.DATABASE_ERROR(),
							),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
};
