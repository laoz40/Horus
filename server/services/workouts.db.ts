import "server-only";

import { countDistinct, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	exerciseMuscleGroups,
	muscleGroups,
	workoutExercises,
	workouts,
	workoutSets,
} from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

export type ListWorkoutsQuery = {
	userId: string;
	limit: number;
	offset: number;
};

export type WorkoutHistoryRow = {
	id: string;
	createdAt: Date;
	name: string;
	durationSeconds: number | null;
	totalPrSets: number;
	exerciseCount: number;
	totalVolume: number;
	muscleGroups: string[];
};

export function listWorkoutRows(query: ListWorkoutsQuery) {
	return tryPromise({
		try: (): Promise<WorkoutHistoryRow[]> =>
			db
				.select({
					id: workouts.id,
					createdAt: workouts.createdAt,
					name: workouts.name,
					durationSeconds: workouts.durationSeconds,
					totalPrSets: workouts.totalPrSets,
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
				.where(eq(workouts.userId, query.userId))
				.groupBy(workouts.id)
				.orderBy(desc(workouts.createdAt))
				.limit(query.limit + 1)
				.offset(query.offset),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
