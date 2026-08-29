import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { checkSetPr, getRecentSets, searchExercises } from "@/server/services/exercises.service";

const databaseError = {
	DATABASE_ERROR: {
		message: "The database operation failed",
	},
};

export const exercisesRouter = {
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
		.handler(async ({ input, context, errors }) => {
			const result = await checkSetPr({
				userId: context.userId,
				exerciseName: input.exerciseName,
				sets: input.sets,
				setIndex: input.setIndex,
			});

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to check set PR", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	search: protectedProcedure
		.errors(databaseError)
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
};
