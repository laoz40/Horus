-- @param {String} $1:workoutId
SELECT
  w_exercises.id,
  exercises.id AS exercise_id,
  exercises.name,
  coalesce(
    array_agg(muscle_groups.name ORDER BY muscle_groups.name)
      FILTER (WHERE muscle_groups.name IS NOT NULL),
    array[]::text[]
  ) AS muscle_groups,
  w_exercises.difficulty,
  w_exercises.notes,
  w_exercises.position
FROM workout_exercises AS w_exercises
INNER JOIN exercises ON exercises.id = w_exercises.exercise_id
LEFT JOIN exercise_muscle_groups AS e_muscle_groups
  ON e_muscle_groups.exercise_id = exercises.id
LEFT JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
WHERE w_exercises.workout_id = $1::uuid
GROUP BY w_exercises.id, exercises.id
ORDER BY w_exercises.position ASC
