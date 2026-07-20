import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { exerciseMuscleGroups, exercises, muscleGroups } from "@/lib/db/schema";
import { normalizeName } from "@/lib/normalizeName";
import { protectedProcedure } from "@/server/procedures";

export const exercisesRouter = {
	search: protectedProcedure
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
		.handler(async ({ input, context }) => {
			const query = normalizeName(input.query);

			return db
				.select({
					id: exercises.id,
					name: exercises.name,
					normalizedName: exercises.normalizedName,
					muscleGroups: sql<string[]>`coalesce(
						array_agg(${muscleGroups.name} order by ${muscleGroups.name})
							filter (where ${muscleGroups.name} is not null),
						array[]::text[]
					)`,
				})
				.from(exercises)
				.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
				.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
				.where(
					sql`${exercises.userId} = ${context.userId} and position(${query} in ${exercises.normalizedName}) > 0`,
				)
				.groupBy(exercises.id)
				.orderBy(asc(exercises.name))
				.limit(10);
		}),
};
