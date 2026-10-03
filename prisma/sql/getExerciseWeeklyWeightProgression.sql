-- @param {String} $1:userId
-- @param {String} $2:normalizedExerciseName
-- @param {DateTime} $3:sinceCreatedAt
-- @param {Int} $4:minReps
SELECT
  date_trunc('week', workouts.created_at)::timestamptz AS week_start,
  max(w_sets.weight)::double precision AS max_weight
FROM workout_sets AS w_sets
INNER JOIN workout_exercises AS w_exercises
  ON w_exercises.id = w_sets.workout_exercise_id
INNER JOIN workouts ON workouts.id = w_exercises.workout_id
INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
WHERE workouts.user_id = $1
  AND exercises.user_id = $1
  AND exercises.normalized_name = $2
  AND w_sets.completed = true
  AND w_sets.weight > 0
  AND w_sets.reps >= $4
  AND workouts.created_at >= $3
GROUP BY 1
ORDER BY 1
