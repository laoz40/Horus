-- @param {String} $1:userId
-- @param {String} $2:normalizedName
SELECT id
FROM exercises
WHERE user_id = $1 AND normalized_name = $2
LIMIT 1
