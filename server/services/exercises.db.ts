import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exerciseMuscleGroups, exercises, muscleGroups } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

export function searchExerciseRows(userId: string, normalizedQuery: string) {
	return tryPromise({
		try: () =>
			db
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
					sql`${exercises.userId} = ${userId} and position(${normalizedQuery} in ${exercises.normalizedName}) > 0`,
				)
				.groupBy(exercises.id)
				.orderBy(asc(exercises.name))
				.limit(10),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
