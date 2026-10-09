-- @param {String} $1:workoutId
DELETE FROM workout_exercises WHERE workout_id = $1::uuid;
