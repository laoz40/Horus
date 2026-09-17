-- @param {String} $1:userId
-- @param {String} $2:normalizedQuery
SELECT
  exercises.id,
  exercises.name,
  exercises.normalized_name,
  coalesce(
    array_agg(muscle_groups.name ORDER BY muscle_groups.name)
      FILTER (WHERE muscle_groups.name IS NOT NULL),
    array[]::text[]
  ) AS muscle_groups
FROM exercises
LEFT JOIN exercise_muscle_groups AS e_muscle_groups
  ON e_muscle_groups.exercise_id = exercises.id
LEFT JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
WHERE exercises.user_id = $1
  AND position($2 in exercises.normalized_name) > 0
GROUP BY exercises.id
ORDER BY exercises.name ASC
LIMIT 10
