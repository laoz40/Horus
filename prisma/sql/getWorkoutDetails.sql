-- @param {String} $1:workoutId
-- @param {String} $2:userId
SELECT
  workouts.id,
  workouts.created_at,
  workouts.name,
  workouts.duration_seconds
FROM workouts
WHERE workouts.id = $1::uuid
  AND workouts.user_id = $2
LIMIT 1
