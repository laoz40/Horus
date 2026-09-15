import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { exerciseMuscleGroups, exercises, muscleGroups, workoutExercises } from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

export function listUserExerciseRows(userId: string) {
	return tryPromise({
		try: () =>
			db
				.select({
					id: exercises.id,
					name: exercises.name,
					muscleGroups: sql<string[]>`coalesce(
						array_agg(${muscleGroups.name} order by ${muscleGroups.name})
							filter (where ${muscleGroups.name} is not null),
						array[]::text[]
					)`,
					workoutCount: sql<number>`(
						select count(*)::integer
						from ${workoutExercises}
						where ${workoutExercises.exerciseId} = ${exercises.id}
					)`,
				})
				.from(exercises)
				.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
				.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
				.where(eq(exercises.userId, userId))
				.groupBy(exercises.id)
				.orderBy(asc(exercises.name)),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
