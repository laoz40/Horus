-- @param {String} $1:userId
-- @param {String} $2:normalizedExerciseName
SELECT
  count(*) > 0 AS has_history,
  coalesce(
    max(w_sets.weight) FILTER (WHERE w_sets.weight > 0),
    0
  )::double precision AS highest_weight,
  coalesce(
    max(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.weight > 0),
    0
  )::double precision AS highest_volume,
  coalesce(
    max(w_sets.reps) FILTER (WHERE w_sets.weight = 0),
    0
  )::double precision AS highest_bodyweight_reps
FROM workout_sets AS w_sets
INNER JOIN workout_exercises AS w_exercises
  ON w_exercises.id = w_sets.workout_exercise_id
INNER JOIN workouts ON workouts.id = w_exercises.workout_id
INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
WHERE workouts.user_id = $1
  AND exercises.user_id = $1
  AND exercises.normalized_name = $2
  AND w_sets.completed = true
