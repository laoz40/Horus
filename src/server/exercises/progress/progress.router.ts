import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { exerciseWeightProgressionRanges } from "@/features/progress/lib/exerciseWeightProgression";
import { progressDb } from "@/server/exercises/progress/progress.db";
import { protectedProcedure } from "@/server/procedures";
import {
	getExercisePersonalRecords,
	getExerciseWeeklyWeightProgression,
	getRecentSets,
} from "@/server/exercises/progress/progress.service";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const exercisesProgressProcedures = {
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
						DatabaseError: (error) => {
							return Effect.logError("Failed to get recent sets", { cause: error.cause }).pipe(
								Effect.andThen(Effect.fail(errors.DATABASE_ERROR())),
							);
						},
					}),
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
						DatabaseError: (error) => {
							return Effect.logError("Failed to get weekly weight progression", {
								cause: error.cause,
							}).pipe(Effect.andThen(Effect.fail(errors.DATABASE_ERROR())));
						},
					}),
				),
			);
		}),
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
					Effect.provide(progressDb),
					Effect.catchTags({
						DatabaseError: (error) => {
							return Effect.logError("Failed to get exercise personal records", {
								cause: error.cause,
							}).pipe(Effect.andThen(Effect.fail(errors.DATABASE_ERROR())));
						},
					}),
				),
			);
		}),
};
