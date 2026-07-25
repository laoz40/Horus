import "server-only";

import { z } from "zod";
import { protectedProcedure } from "@/server/procedures";
import { db } from "@/lib/db";
import {
	workouts,
	workoutExercises,
	workoutSets,
	muscleGroups,
	exerciseMuscleGroups,
} from "@/lib/db/schema";
import { desc, eq, countDistinct, sql } from "drizzle-orm";

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
	list: protectedProcedure
		.input(historyInputSchema)
		.output(historySchema)
		.handler(async ({ input, context }) => {
			const rows = await db
				.select({
					id: workouts.id,
					createdAt: workouts.createdAt,
					name: workouts.name,
					durationSeconds: workouts.durationSeconds,
					exerciseCount: countDistinct(workoutExercises.id),
					totalVolume: sql<number>`coalesce(sum(${workoutSets.weight} * ${workoutSets.reps})
						filter (where ${workoutSets.completed} = true),
						0
					)::double precision`,
					muscleGroups: sql<string[]>`(
						select coalesce(
							array_agg(distinct ${muscleGroups.name} order by ${muscleGroups.name}),
							array[]::text[]
						)
						from ${workoutExercises} as workout_exercises_for_muscle_groups
						join ${exerciseMuscleGroups} on ${exerciseMuscleGroups.exerciseId} = workout_exercises_for_muscle_groups.exercise_id
						join ${muscleGroups} on ${muscleGroups.id} = ${exerciseMuscleGroups.muscleGroupId}
						where workout_exercises_for_muscle_groups.workout_id = ${workouts.id}
					)`,
				})
				.from(workouts)
				.leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
				.leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
				.where(eq(workouts.userId, context.userId))
				.groupBy(workouts.id)
				.orderBy(desc(workouts.createdAt))
				.limit(input.limit + 1) // limit + 1 pagination pattern. if 11 is returned, next page exists
				.offset(input.offset);

			const pageWorkouts = rows.slice(0, input.limit);

			return {
				items: pageWorkouts.map((workout) => ({
					_id: workout.id,
					_creationTime: workout.createdAt.getTime(),
					name: workout.name,
					durationSeconds: workout.durationSeconds,
					totalVolume: workout.totalVolume,
					totalPrSets: 0,
					exerciseCount: workout.exerciseCount,
					muscleGroups: workout.muscleGroups,
				})),
				// if extra rows exist, then return offset for next page, else null
				nextOffset: rows.length > input.limit ? input.offset + input.limit : null,
			};
		}),
};
