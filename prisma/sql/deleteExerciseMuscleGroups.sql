-- @param {String} $1:exerciseId
DELETE FROM exercise_muscle_groups WHERE exercise_id = $1::uuid;
