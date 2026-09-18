-- @param {String} $1:workoutId
SELECT
  w_sets.id,
  w_sets.workout_exercise_id,
  w_sets.weight,
  w_sets.reps,
  w_sets.completed,
  w_sets.is_weight_pr,
  w_sets.is_volume_pr,
  w_sets.is_bodyweight_reps_pr,
  w_sets.position
FROM workout_sets AS w_sets
INNER JOIN workout_exercises AS w_exercises
  ON w_exercises.id = w_sets.workout_exercise_id
WHERE w_exercises.workout_id = $1::uuid
ORDER BY w_sets.position ASC
