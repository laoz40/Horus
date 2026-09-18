-- @param {String} $1:workoutId
SELECT DISTINCT w_exercises.exercise_id
FROM workout_exercises AS w_exercises
WHERE w_exercises.workout_id = $1::uuid
