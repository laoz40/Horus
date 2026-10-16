import { transactions } from "@/server/transactions";
import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import { exerciseDb } from "@/features/exercise-library/server/exercises.db";
import {
	createUserExercise,
	deleteUserExercise,
	listUserExercises,
	mergeUserExercises,
	updateUserExercise,
} from "@/features/exercise-library/server/library.service";
import {
	databaseError,
	exerciseLibraryErrors,
	exerciseLibraryItemSchema,
	exerciseLibraryWriteErrorHandlers,
	exerciseLibraryWriteOutputSchema,
	exerciseLibraryWriteProcedureErrors,
} from "@/features/exercise-library/server/exercise-library.router.helpers";

const exerciseLibraryWriteInputSchema = z
	.object({
		name: z.string().trim().min(1),
		muscleGroups: z.array(z.string()),
	})
	.strict();

export const exerciseLibraryRouter = {
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
						DatabaseError: (error) =>
							logDatabaseError("Failed to list exercises", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	create: protectedProcedure
		.errors(exerciseLibraryWriteProcedureErrors)
		.input(exerciseLibraryWriteInputSchema)
		.output(exerciseLibraryWriteOutputSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				createUserExercise({ userId: context.userId, exercise: input }).pipe(
					Effect.map((exercise) => ({ exercise })),
					Effect.provide(exerciseDb),
					Effect.provide(transactions),
					Effect.catchTags({
						...exerciseLibraryWriteErrorHandlers(errors),
						DatabaseError: (error) =>
							logDatabaseError("Failed to create exercise", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
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
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				updateUserExercise({
					userId: context.userId,
					exerciseId: input.id,
					exercise: input,
				}).pipe(
					Effect.map((exercise) => ({ exercise })),
					Effect.provide(exerciseDb),
					Effect.provide(transactions),
					Effect.catchTags({
						...exerciseLibraryWriteErrorHandlers(errors),
						DatabaseError: (error) =>
							logDatabaseError("Failed to update exercise", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
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
				deleteUserExercise(context.userId, input.id).pipe(
					Effect.provide(exerciseDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to delete exercise", error.cause, errors.DATABASE_ERROR()),
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
						DatabaseError: (error) =>
							logDatabaseError("Failed to merge exercises", error.cause, errors.DATABASE_ERROR()),
						ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
};
