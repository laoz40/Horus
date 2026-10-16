import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { exerciseWeightProgressionRanges } from "@/features/exercise-progress/lib/exerciseWeightProgression";
import { progressDb } from "@/features/exercise-progress/server/exercise-progress.db";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import {
	getExerciseWeeklyWeightProgression,
	getRecentSets,
} from "@/features/exercise-progress/server/exercise-progress.service";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const exerciseProgressRouter = {
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
			return Effect.runPromise(
				getRecentSets(context.userId, input.exerciseName).pipe(
					Effect.provide(progressDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError("Failed to get recent sets", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			);
		}),
	weeklyWeightProgression: protectedProcedure
		.errors(databaseError)
		.input(
			z
				.object({
					exerciseName: z.string().trim().min(1),
					range: z.enum(exerciseWeightProgressionRanges),
				})
				.strict(),
		)
		.output(
			z.array(
				z
					.object({
						weekStartMs: z.number(),
						maxWeight: z.number(),
						isPeriodPeak: z.boolean(),
					})
					.strict(),
			),
		)
		.handler(async ({ input, context, errors }) => {
			return Effect.runPromise(
				getExerciseWeeklyWeightProgression(context.userId, input.exerciseName, input.range).pipe(
					Effect.provide(progressDb),
					Effect.catchTags({
						DatabaseError: (error) =>
							logDatabaseError(
								"Failed to get weekly weight progression",
								error.cause,
								errors.DATABASE_ERROR(),
							),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			);
		}),
};
