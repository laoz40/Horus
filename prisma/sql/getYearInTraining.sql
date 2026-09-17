-- @param {String} $1:userId
-- @param {DateTime} $2:start
-- @param {DateTime} $3:end
SELECT
  to_char(workouts.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_key,
  count(w_sets.id)::int AS set_count
FROM workouts
INNER JOIN workout_exercises AS w_exercises
  ON w_exercises.workout_id = workouts.id
INNER JOIN workout_sets AS w_sets
  ON w_sets.workout_exercise_id = w_exercises.id
WHERE workouts.user_id = $1
  AND w_sets.completed = true
  AND workouts.created_at >= $2
  AND workouts.created_at < $3
GROUP BY 1
ORDER BY 1
