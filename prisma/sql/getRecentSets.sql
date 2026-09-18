-- @param {String} $1:userId
-- @param {String} $2:normalizedExerciseName
WITH matching_completed_sets AS (
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
  WHERE workouts.user_id = $1
    AND exercises.user_id = $1
    AND exercises.normalized_name = $2
    AND w_sets.completed = true
),
recent_sets AS (
  SELECT *
  FROM matching_completed_sets
  ORDER BY
    completed_at_ms DESC,
    workout_id DESC,
    exercise_position DESC,
    set_position DESC
  LIMIT 6
),
weight_pr AS (
  SELECT set_id AS weight_pr_set_id
  FROM matching_completed_sets
  WHERE set_weight > 0
  ORDER BY
    set_weight DESC,
    completed_at_ms ASC,
    workout_id ASC,
    exercise_position ASC,
    set_position ASC
  LIMIT 1
),
volume_pr AS (
  SELECT set_id AS volume_pr_set_id
  FROM matching_completed_sets
  WHERE set_weight * set_reps > 0
  ORDER BY
    set_weight * set_reps DESC,
    completed_at_ms ASC,
    workout_id ASC,
    exercise_position ASC,
    set_position ASC
  LIMIT 1
),
bodyweight_reps_pr AS (
  SELECT set_id AS bodyweight_reps_pr_set_id
  FROM matching_completed_sets
  WHERE set_weight = 0 AND set_reps > 0
  ORDER BY
    set_reps DESC,
    completed_at_ms ASC,
    workout_id ASC,
    exercise_position ASC,
    set_position ASC
  LIMIT 1
)
SELECT
  recent_sets.set_id AS id,
  recent_sets.set_weight AS weight,
  recent_sets.set_reps AS reps,
  recent_sets.completed_at_ms,
  coalesce(recent_sets.set_id = weight_pr.weight_pr_set_id, false) AS is_weight_pr,
  coalesce(recent_sets.set_id = volume_pr.volume_pr_set_id, false) AS is_volume_pr,
  coalesce(recent_sets.set_id = bodyweight_reps_pr.bodyweight_reps_pr_set_id, false) AS is_bodyweight_reps_pr
FROM recent_sets
LEFT JOIN weight_pr ON true
LEFT JOIN volume_pr ON true
LEFT JOIN bodyweight_reps_pr ON true
ORDER BY
  recent_sets.completed_at_ms DESC,
  recent_sets.workout_id DESC,
  recent_sets.exercise_position DESC,
  recent_sets.set_position DESC
