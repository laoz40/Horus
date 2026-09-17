UPDATE workout_sets AS w_sets
SET
  is_weight_pr = batch.is_weight_pr,
  is_volume_pr = batch.is_volume_pr,
  is_bodyweight_reps_pr = batch.is_bodyweight_reps_pr
FROM (
  SELECT *
  FROM unnest(
    $1::uuid[],
    $2::boolean[],
    $3::boolean[],
    $4::boolean[]
  ) AS batch(set_id, is_weight_pr, is_volume_pr, is_bodyweight_reps_pr)
) AS batch
WHERE w_sets.id = batch.set_id
