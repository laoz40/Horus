import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	exerciseMuscleGroups,
	exercises,
	muscleGroups,
	workoutExercises,
	workouts,
	workoutSets,
} from "@/lib/db/schema";
import { tryPromise } from "@/lib/tryPromise";

export interface RecentSetRow {
	weight: number;
	reps: number;
	completedAtMs: number;
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}

export interface ExercisePrRow {
	hasHistory: boolean;
	highestWeight: number;
	highestVolume: number;
	highestBodyweightReps: number;
}

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

export function getExercisePrRows(userId: string, normalizedExerciseName: string) {
	return tryPromise({
		try: (): Promise<ExercisePrRow[]> =>
			db
				.select({
					hasHistory: sql<boolean>`count(*) > 0`,
					highestWeight: sql<number>`coalesce(
						max(${workoutSets.weight}) filter (where ${workoutSets.weight} > 0),
						0
					)::double precision`,
					highestVolume: sql<number>`coalesce(
						max(${workoutSets.weight} * ${workoutSets.reps}) filter (
							where ${workoutSets.weight} > 0
						),
						0
					)::double precision`,
					highestBodyweightReps: sql<number>`coalesce(
						max(${workoutSets.reps}) filter (where ${workoutSets.weight} = 0),
						0
					)::double precision`,
				})
				.from(workoutSets)
				.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
				.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
				.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
				.where(
					and(
						eq(workouts.userId, userId),
						eq(exercises.userId, userId),
						eq(exercises.normalizedName, normalizedExerciseName),
						eq(workoutSets.completed, true),
					),
				),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

export function getRecentSetRows(userId: string, normalizedExerciseName: string) {
	// Materialize the matching history once so each small top-N query reuses it.
	const matchingSets = db.$with("matching_completed_sets").as(
		db
			.select({
				id: sql<string>`${workoutSets.id}`.as("set_id"),
				weight: sql<number>`${workoutSets.weight}`.mapWith(workoutSets.weight).as("set_weight"),
				reps: sql<number>`${workoutSets.reps}`.mapWith(workoutSets.reps).as("set_reps"),
				completedAtMs: sql<number>`(
				extract(epoch from ${workouts.createdAt}) * 1000
			)::double precision`.as("completed_at_ms"),
				workoutId: sql<string>`${workouts.id}`.as("workout_id"),
				exercisePosition: sql<number>`${workoutExercises.position}`.as("exercise_position"),
				setPosition: sql<number>`${workoutSets.position}`.as("set_position"),
			})
			.from(workoutSets)
			.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
			.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
			.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
			.where(
				and(
					eq(workouts.userId, userId),
					eq(exercises.userId, userId),
					eq(exercises.normalizedName, normalizedExerciseName),
					eq(workoutSets.completed, true),
				),
			),
	);

	const recentSets = db
		.$with("recent_sets")
		.as(
			db
				.select()
				.from(matchingSets)
				.orderBy(
					desc(matchingSets.completedAtMs),
					desc(matchingSets.workoutId),
					desc(matchingSets.exercisePosition),
					desc(matchingSets.setPosition),
				)
				.limit(6),
		);

	// Select exact set IDs so equal records keep the earliest record holder.
	const weightPr = db.$with("weight_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("weight_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} > 0`)
			.orderBy(
				desc(matchingSets.weight),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	const volumePr = db.$with("volume_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("volume_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} * ${matchingSets.reps} > 0`)
			.orderBy(
				desc(sql`${matchingSets.weight} * ${matchingSets.reps}`),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	const bodyweightRepsPr = db.$with("bodyweight_reps_pr").as(
		db
			.select({ id: sql<string>`${matchingSets.id}`.as("bodyweight_reps_pr_set_id") })
			.from(matchingSets)
			.where(sql`${matchingSets.weight} = 0 and ${matchingSets.reps} > 0`)
			.orderBy(
				desc(matchingSets.reps),
				asc(matchingSets.completedAtMs),
				asc(matchingSets.workoutId),
				asc(matchingSets.exercisePosition),
				asc(matchingSets.setPosition),
			)
			.limit(1),
	);

	return tryPromise({
		try: (): Promise<RecentSetRow[]> =>
			db
				.with(matchingSets, recentSets, weightPr, volumePr, bodyweightRepsPr)
				.select({
					weight: recentSets.weight,
					reps: recentSets.reps,
					completedAtMs: recentSets.completedAtMs,
					isWeightPr: sql<boolean>`coalesce(${recentSets.id} = ${weightPr.id}, false)`,
					isVolumePr: sql<boolean>`coalesce(${recentSets.id} = ${volumePr.id}, false)`,
					isBodyweightRepsPr: sql<boolean>`coalesce(${recentSets.id} = ${bodyweightRepsPr.id}, false)`,
				})
				.from(recentSets)
				.leftJoin(weightPr, sql`true`)
				.leftJoin(volumePr, sql`true`)
				.leftJoin(bodyweightRepsPr, sql`true`)
				.orderBy(
					desc(recentSets.completedAtMs),
					desc(recentSets.workoutId),
					desc(recentSets.exercisePosition),
					desc(recentSets.setPosition),
				),
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}
