-- @param {String} $1:sourceId
-- @param {String} $2:targetId
INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id)
SELECT $2::uuid, muscle_group_id
FROM exercise_muscle_groups
WHERE exercise_id = $1::uuid
ON CONFLICT DO NOTHING
