import "server-only";

import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
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

export type ListWorkoutsQuery = {
	userId: string;
	limit: number;
	offset: number;
};

export type WorkoutForEdit = {
	id: string;
	name: string;
	durationSeconds: number | null;
	exercises: Array<{
		id: string;
		name: string;
		muscleGroups: string[];
		difficulty: number | null;
		notes: string;
		sets: Array<{
			id: string;
			weight: number;
			reps: number;
			completed: boolean;
		}>;
	}>;
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

function getWorkout(workoutId: string, userId: string) {
	return db
		.select({
			id: workouts.id,
			name: workouts.name,
			durationSeconds: workouts.durationSeconds,
		})
		.from(workouts)
		.where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
		.limit(1)
		.then(([workout]) => workout);
}

function getWorkoutExerciseRows(workoutId: string) {
	return db
		.select({
			id: workoutExercises.id,
			name: exercises.name,
			muscleGroups: sql<string[]>`coalesce(
				array_agg(${muscleGroups.name} order by ${muscleGroups.name})
					filter (where ${muscleGroups.name} is not null),
				array[]::text[]
			)`,
			difficulty: workoutExercises.difficulty,
			notes: workoutExercises.notes,
			position: workoutExercises.position,
		})
		.from(workoutExercises)
		.innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
		.leftJoin(exerciseMuscleGroups, eq(exerciseMuscleGroups.exerciseId, exercises.id))
		.leftJoin(muscleGroups, eq(muscleGroups.id, exerciseMuscleGroups.muscleGroupId))
		.where(eq(workoutExercises.workoutId, workoutId))
		.groupBy(workoutExercises.id, exercises.id)
		.orderBy(asc(workoutExercises.position));
}

function getWorkoutSetRows(workoutId: string) {
	return db
		.select({
			id: workoutSets.id,
			workoutExerciseId: workoutSets.workoutExerciseId,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			completed: workoutSets.completed,
			position: workoutSets.position,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
		.where(eq(workoutExercises.workoutId, workoutId))
		.orderBy(asc(workoutSets.position));
}

export function getWorkoutForEdit(workoutId: string, userId: string) {
	return tryPromise({
		try: async (): Promise<WorkoutForEdit | null> => {
			const workout = await getWorkout(workoutId, userId);

			if (!workout) {
				return null;
			}

			const [exerciseRows, setRows] = await Promise.all([
				getWorkoutExerciseRows(workout.id),
				getWorkoutSetRows(workout.id),
			]);

			return {
				...workout,
				exercises: exerciseRows.map((exercise) => ({
					id: exercise.id,
					name: exercise.name,
					muscleGroups: exercise.muscleGroups,
					difficulty: exercise.difficulty,
					notes: exercise.notes,
					sets: setRows
						.filter((set) => set.workoutExerciseId === exercise.id)
						.map(({ workoutExerciseId: _workoutExerciseId, position: _position, ...set }) => set),
				})),
			};
		},
		catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
	});
}

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
