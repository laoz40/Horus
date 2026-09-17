-- @param {String} $1:userId
UPDATE workouts AS workouts_to_update
SET total_pr_sets = (
  SELECT count(*)::integer
  FROM workout_exercises AS w_exercises
  INNER JOIN workout_sets AS w_sets
    ON w_sets.workout_exercise_id = w_exercises.id
  WHERE w_exercises.workout_id = workouts_to_update.id
    AND (
      w_sets.is_weight_pr
      OR w_sets.is_volume_pr
      OR w_sets.is_bodyweight_reps_pr
    )
)
WHERE workouts_to_update.user_id = $1
  AND workouts_to_update.id = ANY($2::uuid[])
