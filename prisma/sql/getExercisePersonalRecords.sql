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
weight_pr AS (
  SELECT
    set_id,
    set_weight,
    set_reps,
    completed_at_ms
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
  SELECT
    set_id,
    set_weight,
    set_reps,
    completed_at_ms
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
  SELECT
    set_id,
    set_weight,
    set_reps,
    completed_at_ms
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
  (SELECT count(*) > 0 FROM matching_completed_sets) AS has_history,
  weight_pr.set_id AS weight_id,
  weight_pr.set_weight AS weight_weight,
  weight_pr.set_reps AS weight_reps,
  weight_pr.completed_at_ms AS weight_completed_at_ms,
  volume_pr.set_id AS volume_id,
  volume_pr.set_weight AS volume_weight,
  volume_pr.set_reps AS volume_reps,
  volume_pr.completed_at_ms AS volume_completed_at_ms,
  bodyweight_reps_pr.set_id AS bodyweight_reps_id,
  bodyweight_reps_pr.set_weight AS bodyweight_reps_weight,
  bodyweight_reps_pr.set_reps AS bodyweight_reps_reps,
  bodyweight_reps_pr.completed_at_ms AS bodyweight_reps_completed_at_ms
FROM (SELECT 1) AS _one
LEFT JOIN weight_pr ON true
LEFT JOIN volume_pr ON true
LEFT JOIN bodyweight_reps_pr ON true
