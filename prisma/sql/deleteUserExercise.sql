-- @param {String} $1:userId
-- @param {String} $2:exerciseId
DELETE FROM exercises WHERE user_id = $1 AND id = $2::uuid;
