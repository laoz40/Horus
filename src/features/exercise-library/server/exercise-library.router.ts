import "server-only";

import { Effect, Layer } from "effect";
import { z } from "zod";
import { sqlClient } from "@/lib/db/sql";
import { exerciseDb } from "@/features/exercise-library/server/exercises.db";
import { prHistoryDb } from "@/features/personal-records/server/pr-history.db";
import { databaseError, logDatabaseError, protectedProcedure } from "@/server/procedures";
import type { DatabaseError } from "@/lib/db/database";
import type { ExerciseNameCollisionError } from "@/features/exercise-library/server/library.functions";
import {
	createUserExercise,
	deleteUserExercise,
	listUserExercises,
	mergeUserExercises,
	updateUserExercise,
} from "@/features/exercise-library/server/library.service";

const exerciseLibraryItemSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		muscleGroups: z.array(z.string()),
		workoutCount: z.number().int().nonnegative(),
	})
	.strict();

const exerciseLibraryWriteOutputSchema = z
	.object({
		exercise: exerciseLibraryItemSchema,
	})
	.strict();

const exerciseLibraryWriteProcedureErrors = {
	...databaseError,
	EXERCISE_NOT_FOUND: {
		message: "The exercise was not found",
	},
	NAME_COLLISION: {
		message: "An exercise with this name already exists",
		data: z
			.object({
				existingExercise: exerciseLibraryItemSchema,
			})
			.strict(),
	},
};

function exerciseLibraryWriteErrorHandlers<NameCollisionError, NotFoundError, DatabaseRpcError>(
	errors: {
		NAME_COLLISION: (options: {
			data: {
				existingExercise: InstanceType<typeof ExerciseNameCollisionError>["existingExercise"];
			};
		}) => NameCollisionError;
		EXERCISE_NOT_FOUND: () => NotFoundError;
		DATABASE_ERROR: () => DatabaseRpcError;
	},
	databaseErrorMessage: string,
) {
	return {
		DatabaseError: (error: DatabaseError) =>
			logDatabaseError(databaseErrorMessage, error.cause, errors.DATABASE_ERROR()),
		ExerciseNameCollisionError: (error: ExerciseNameCollisionError) =>
			Effect.fail(errors.NAME_COLLISION({ data: { existingExercise: error.existingExercise } })),
		ExerciseNotFoundError: () => Effect.fail(errors.EXERCISE_NOT_FOUND()),
	};
}

const database = Layer.mergeAll(exerciseDb, prHistoryDb).pipe(Layer.provideMerge(sqlClient));

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
					Effect.provide(database),
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
					Effect.provide(database),
					Effect.catchTags(exerciseLibraryWriteErrorHandlers(errors, "Failed to create exercise")),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	update: protectedProcedure
		.errors(exerciseLibraryWriteProcedureErrors)
		.input(exerciseLibraryWriteInputSchema.extend({ id: z.uuid() }))
		.output(exerciseLibraryWriteOutputSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				updateUserExercise({
					userId: context.userId,
					exerciseId: input.id,
					exercise: input,
				}).pipe(
					Effect.map((exercise) => ({ exercise })),
					Effect.provide(database),
					Effect.catchTags(exerciseLibraryWriteErrorHandlers(errors, "Failed to update exercise")),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	delete: protectedProcedure
		.errors({
			...databaseError,
			EXERCISE_NOT_FOUND: {
				message: "The exercise was not found",
			},
			EXERCISE_IN_USE: {
				message: "This exercise is used in workouts and cannot be deleted",
			},
		})
		.input(z.object({ id: z.uuid() }).strict())
		.output(z.object({ deleted: z.literal(true) }).strict())
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				deleteUserExercise(context.userId, input.id).pipe(
					Effect.provide(database),
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
			...databaseError,
			EXERCISE_NOT_FOUND: {
				message: "The exercise was not found",
			},
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
					Effect.provide(database),
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
