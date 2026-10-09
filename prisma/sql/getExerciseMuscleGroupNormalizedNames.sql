-- @param {String} $1:exerciseId
SELECT muscle_groups.normalized_name
FROM exercise_muscle_groups
JOIN muscle_groups ON muscle_groups.id = exercise_muscle_groups.muscle_group_id
WHERE exercise_muscle_groups.exercise_id = $1::uuid
