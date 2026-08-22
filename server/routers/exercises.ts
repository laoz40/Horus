import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { searchExercises } from "@/server/services/exercises.service";

export const exercisesRouter = {
	search: protectedProcedure
		.errors({
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(
			z.object({
				query: z.string(),
			}),
		)
		.output(
			z.array(
				z.object({
					id: z.uuid(),
					name: z.string(),
					normalizedName: z.string(),
					muscleGroups: z.array(z.string()),
				}),
			),
		)
		.handler(async ({ input, context, errors }) => {
			const result = await searchExercises(context.userId, input.query);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to search exercises", { cause: error.cause });
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
