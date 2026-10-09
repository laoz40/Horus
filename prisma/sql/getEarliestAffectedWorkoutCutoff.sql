-- @param {String} $1:userId
SELECT workouts.id, workouts.created_at
FROM workouts
WHERE workouts.user_id = $1
  AND EXISTS (
    SELECT 1 FROM workout_exercises
    WHERE workout_exercises.workout_id = workouts.id
      AND workout_exercises.exercise_id = ANY($2::uuid[])
  )
ORDER BY workouts.created_at ASC, workouts.id ASC
LIMIT 1
