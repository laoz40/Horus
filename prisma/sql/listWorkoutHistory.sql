-- @param {String} $1:userId
-- @param {Int} $2:limit
-- @param {Int} $3:offset
SELECT
  workouts.id,
  workouts.created_at,
  workouts.name,
  workouts.duration_seconds,
  workouts.total_pr_sets,
  count(DISTINCT w_exercises.id)::int AS exercise_count,
  coalesce(
    sum(w_sets.weight * w_sets.reps) FILTER (WHERE w_sets.completed = true),
    0
  )::double precision AS total_volume,
  (
    SELECT coalesce(
      array_agg(DISTINCT muscle_groups.name ORDER BY muscle_groups.name),
      array[]::text[]
    )
    FROM workout_exercises AS w_exercises_muscles
    JOIN exercises ON exercises.id = w_exercises_muscles.exercise_id
    JOIN exercise_muscle_groups AS e_muscle_groups
      ON e_muscle_groups.exercise_id = exercises.id
    JOIN muscle_groups ON muscle_groups.id = e_muscle_groups.muscle_group_id
    WHERE w_exercises_muscles.workout_id = workouts.id
  ) AS muscle_groups
FROM workouts
LEFT JOIN workout_exercises AS w_exercises
  ON w_exercises.workout_id = workouts.id
LEFT JOIN workout_sets AS w_sets
  ON w_sets.workout_exercise_id = w_exercises.id
WHERE workouts.user_id = $1
GROUP BY workouts.id
ORDER BY workouts.created_at DESC
LIMIT $2
OFFSET $3
