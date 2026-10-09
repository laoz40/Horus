-- @param {String} $1:userId
-- @param {String} $2:exerciseId
SELECT id FROM exercises
WHERE id = $2::uuid AND user_id = $1
LIMIT 1
