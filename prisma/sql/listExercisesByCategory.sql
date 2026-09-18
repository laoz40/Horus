-- @param {String} $1:userId
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
INNER JOIN exercise_muscle_groups AS e_muscle_groups
  ON e_muscle_groups.exercise_id = exercises.id
INNER JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
WHERE exercises.user_id = $1
  AND EXISTS (
    SELECT 1
    FROM exercise_muscle_groups AS filter_e_muscle_groups
    INNER JOIN muscle_groups AS filter_muscle_groups
      ON filter_muscle_groups.id = filter_e_muscle_groups.muscle_group_id
    WHERE filter_e_muscle_groups.exercise_id = exercises.id
      AND filter_muscle_groups.normalized_name = ANY($2::text[])
  )
GROUP BY exercises.id
ORDER BY exercises.name ASC
