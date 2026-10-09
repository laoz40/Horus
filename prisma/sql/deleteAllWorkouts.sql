-- @param {String} $1:userId
WITH deleted_workouts AS (
  DELETE FROM workouts
  WHERE user_id = $1
  RETURNING id
)
SELECT count(*)::integer AS deleted_count
FROM deleted_workouts
