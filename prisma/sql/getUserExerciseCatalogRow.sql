-- @param {String} $1:userId
-- @param {String} $2:exerciseId
SELECT
  exercises.id,
  exercises.name,
  coalesce(
    array_agg(muscle_groups.name ORDER BY muscle_groups.name)
      FILTER (WHERE muscle_groups.name IS NOT NULL),
    array[]::text[]
  ) AS muscle_groups,
  coalesce(max(workout_counts.workout_count), 0)::int AS workout_count
FROM exercises
LEFT JOIN (
  SELECT exercise_id, count(*)::int AS workout_count
  FROM workout_exercises
  GROUP BY exercise_id
) AS workout_counts ON workout_counts.exercise_id = exercises.id
LEFT JOIN exercise_muscle_groups AS e_muscle_groups
  ON e_muscle_groups.exercise_id = exercises.id
LEFT JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
WHERE exercises.user_id = $1
  AND exercises.id = $2::uuid
GROUP BY exercises.id
LIMIT 1
