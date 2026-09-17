-- @param {String} $1:userId
-- @param {DateTime} $3:cutoffCreatedAt
-- @param {String} $4:cutoffWorkoutId
SELECT
  w_sets.id AS set_id,
  workouts.id AS workout_id,
  w_exercises.exercise_id,
  w_sets.weight,
  w_sets.reps,
  w_sets.completed
FROM workout_sets AS w_sets
INNER JOIN workout_exercises AS w_exercises
  ON w_exercises.id = w_sets.workout_exercise_id
INNER JOIN workouts ON workouts.id = w_exercises.workout_id
WHERE workouts.user_id = $1
  AND w_exercises.exercise_id = ANY($2::uuid[])
  AND (
    workouts.created_at > $3
    OR (workouts.created_at = $3 AND workouts.id >= $4::uuid)
  )
ORDER BY
  workouts.created_at ASC,
  workouts.id ASC,
  w_exercises.position ASC,
  w_sets.position ASC
