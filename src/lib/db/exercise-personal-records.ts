import "server-only";

import type { SqlClient } from "effect/sql";

interface ExercisePersonalRecordQuery {
	readonly userId: string;
	readonly normalizedExerciseName: string;
}

export function exercisePersonalRecordCtes(
	sql: SqlClient.SqlClient,
	{ userId, normalizedExerciseName }: ExercisePersonalRecordQuery,
) {
	return sql`
		matching_completed_sets AS (
			SELECT
				w_sets.id AS set_id,
				w_sets.weight AS set_weight,
				w_sets.reps AS set_reps,
				(extract(epoch FROM workouts.created_at) * 1000)::double precision AS completed_at_ms,
				workouts.id AS workout_id,
				w_exercises.position AS exercise_position,
				w_sets.position AS set_position
			FROM workout_sets AS w_sets
			INNER JOIN workout_exercises AS w_exercises
				ON w_exercises.id = w_sets.workout_exercise_id
			INNER JOIN workouts ON workouts.id = w_exercises.workout_id
			INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
			WHERE workouts.user_id = ${userId}
				AND exercises.user_id = ${userId}
				AND exercises.normalized_name = ${normalizedExerciseName}
				AND w_sets.completed = true
		),
		weight_pr AS (
			SELECT set_id, set_weight, set_reps, completed_at_ms
			FROM matching_completed_sets
			WHERE set_weight > 0
			ORDER BY set_weight DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
			LIMIT 1
		),
		volume_pr AS (
			SELECT set_id, set_weight, set_reps, completed_at_ms
			FROM matching_completed_sets
			WHERE set_weight * set_reps > 0
			ORDER BY set_weight * set_reps DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
			LIMIT 1
		),
		bodyweight_reps_pr AS (
			SELECT set_id, set_weight, set_reps, completed_at_ms
			FROM matching_completed_sets
			WHERE set_weight = 0 AND set_reps > 0
			ORDER BY set_reps DESC, completed_at_ms ASC, workout_id ASC, exercise_position ASC, set_position ASC
			LIMIT 1
		)
	`;
}
