import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { getYearInTraining } from "@/server/services/dashboard.service";

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

export const dashboardRouter = {
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
