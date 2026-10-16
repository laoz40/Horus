import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { personalRecordsDb } from "@/features/personal-records/server/personal-records.db";
import {
	checkSetPr,
	getExercisePersonalRecords,
} from "@/features/personal-records/server/personal-records.service";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const personalRecordsRouter = {
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
					Effect.provide(personalRecordsDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to check set PR", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
	personalRecords: protectedProcedure
		.errors(databaseError)
		.input(z.object({ exerciseName: z.string().trim().min(1) }).strict())
		.output(
			z
				.object({
					hasHistory: z.boolean(),
					records: z.array(
						z
							.object({
								type: z.enum(["weight", "volume", "bodyweightReps"]),
								id: z.uuid(),
								weight: z.number(),
								reps: z.number(),
								completedAtMs: z.number(),
							})
							.strict(),
					),
				})
				.strict(),
		)
		.handler(async ({ input, context, errors }) => {
			return Effect.runPromise(
				getExercisePersonalRecords(context.userId, input.exerciseName).pipe(
					Effect.provide(personalRecordsDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError(
								"Failed to get exercise personal records",
								error.cause,
								errors.DATABASE_ERROR(),
							),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			);
		}),
};
