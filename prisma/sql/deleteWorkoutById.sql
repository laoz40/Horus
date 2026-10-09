-- @param {String} $1:workoutId
-- @param {String} $2:userId
DELETE FROM workouts
WHERE id = $1::uuid
  AND user_id = $2
