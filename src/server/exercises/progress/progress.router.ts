import "server-only";

import { z } from "zod";
import { exerciseWeightProgressionRanges } from "@/features/progress/lib/exerciseWeightProgression";
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
			const result = await getExerciseWeeklyWeightProgression(
				context.userId,
				input.exerciseName,
				input.range,
			);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to get weekly weight progression", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
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
			const result = await getExercisePersonalRecords(context.userId, input.exerciseName);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to get exercise personal records", { cause: error.cause });
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
