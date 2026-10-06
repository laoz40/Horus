import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { getTrainingYearRange, getYearInTraining } from "@/server/dashboard/dashboard.service";

const yearInTrainingInputSchema = z
	.object({
		year: z.number().int().min(1).max(9999),
		userId: z.string().optional(),
	})
	.strict();

const yearInTrainingOutputSchema = z.array(
	z.object({
		dayKey: z.iso.date(),
		setCount: z.number().int().positive(),
	}),
);

const trainingYearRangeOutputSchema = z
	.object({
		firstYear: z.number().int().min(1).max(9999),
		lastYear: z.number().int().min(1).max(9999),
	})
	.strict();

export const dashboardRouter = {
	trainingYearRange: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(z.object({}).strict())
		.output(trainingYearRangeOutputSchema)
		.handler(async ({ context, errors }) => {
			const result = await getTrainingYearRange(context.userId);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to load training year range", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),

	yearInTraining: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(yearInTrainingInputSchema)
		.output(yearInTrainingOutputSchema)
		.handler(async ({ input, context, errors }) => {
			const result = await getYearInTraining({ userId: context.userId, year: input.year });

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to load year in training", { cause: error.cause });
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
