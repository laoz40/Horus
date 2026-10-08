import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Database } from "@/lib/db/database";
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
		.handler(({ context, errors }) =>
			Effect.runPromise(
				getTrainingYearRange(context.userId).pipe(
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (value) => value,
						onFailure: (error) => {
							console.error("Failed to load training year range", { cause: error.cause });

							throw errors.DATABASE_ERROR();
						},
					}),
				),
			),
		),

	yearInTraining: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(yearInTrainingInputSchema)
		.output(yearInTrainingOutputSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				getYearInTraining({ userId: context.userId, year: input.year }).pipe(
					Effect.provideService(Database, { prisma }),
					Effect.match({
						onSuccess: (value) => value,
						onFailure: (error) => {
							console.error("Failed to load year in training", { cause: error.cause });

							throw errors.DATABASE_ERROR();
						},
					}),
				),
			),
		),
};
