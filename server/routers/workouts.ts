import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { getWorkoutById, listWorkouts } from "@/server/services/workouts.service";

const workoutFormSchema = z.object({
	name: z.string(),
	durationSeconds: z.number().int().nullable(),
	exercises: z.array(
		z.object({
			id: z.uuid(),
			global: z.object({
				name: z.string(),
				muscleGroups: z.array(z.string()),
			}),
			difficulty: z.number().optional(),
			notes: z.string().optional(),
			sets: z.array(
				z.object({
					id: z.uuid(),
					weight: z.number(),
					reps: z.number(),
					completed: z.boolean(),
				}),
			),
		}),
	),
});

const historyInputSchema = z.object({
	limit: z.number().int().min(1).max(25),
	offset: z.number().int().nonnegative(),
});

const historyItemSchema = z.object({
	_id: z.uuid(),
	_creationTime: z.number(),
	name: z.string(),
	durationSeconds: z.number().nullable(),
	totalVolume: z.number(),
	totalPrSets: z.number(),
	exerciseCount: z.number(),
	muscleGroups: z.array(z.string()),
});

const historySchema = z.object({
	items: z.array(historyItemSchema),
	nextOffset: z.number().int().nonnegative().nullable(),
});

export const workoutsRouter = {
	getById: protectedProcedure
		.input(z.object({ id: z.uuid() }))
		.output(workoutFormSchema)
		.handler(async ({ input, context, errors }) => {
			const result = await getWorkoutById(input.id, context.userId);

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "NOT_FOUND":
							throw errors.NOT_FOUND();
						case "DATABASE_ERROR":
							console.error("Failed to load workout", { cause: error.cause });
							throw errors.DATABASE_ERROR();
						default: {
							const exhaustiveReason: never = reason;
							throw exhaustiveReason;
						}
					}
				},
			);
		}),
	list: protectedProcedure
		.input(historyInputSchema)
		.output(historySchema)
		.handler(async ({ input, context, errors }) => {
			const result = await listWorkouts({ ...input, userId: context.userId });

			return result.match(
				(value) => value,
				(error) => {
					const reason = error.reason;

					switch (reason) {
						case "DATABASE_ERROR":
							console.error("Failed to list workouts", { cause: error.cause });
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
