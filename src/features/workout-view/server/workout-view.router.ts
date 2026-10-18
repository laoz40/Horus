import { database } from "@/server/database";
import "server-only";

import { Effect } from "effect";
import { z } from "zod";
import { logDatabaseError, protectedProcedure } from "@/server/procedures";
import { getWorkoutById } from "@/features/workout-view/server/workout-view.service";

const workoutFormSchema = z.object({
	name: z.string(),
	createdAt: z.number(),
	durationSeconds: z.number().int().nullable(),
	exercises: z.array(
		z.object({
			id: z.uuid(),
			exerciseId: z.uuid(),
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
					prTypes: z.array(z.enum(["weight", "volume", "bodyweightReps"])).optional(),
				}),
			),
		}),
	),
});

export const workoutViewRouter = {
	getById: protectedProcedure
		.errors({
			NOT_FOUND: {
				message: "The requested resource was not found",
			},
			DATABASE_ERROR: {
				message: "The database operation failed",
			},
		})
		.input(z.object({ id: z.uuid() }))
		.output(workoutFormSchema)
		.handler(({ input, context, errors }) =>
			Effect.runPromise(
				getWorkoutById(input.id, context.userId).pipe(
					Effect.provide(database),
					Effect.catchTags({
						NOT_FOUND: () => Effect.fail(errors.NOT_FOUND()),
						DatabaseError: (error) =>
							logDatabaseError("Failed to load workout", error.cause, errors.DATABASE_ERROR()),
					}),
					Effect.annotateLogs(context.logAnnotations),
				),
			),
		),
};
