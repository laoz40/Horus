-- @param {String} $1:userId
SELECT min(workouts.created_at) AS oldest_created_at
FROM workouts
WHERE workouts.user_id = $1
