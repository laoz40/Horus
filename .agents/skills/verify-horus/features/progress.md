# Progress

`/progress` shows "Your progress" with a back button to the dashboard. Its exercise browser opens weight progression, recent completed sets, and personal records. The year heatmap and year picker live on the dashboard.

## Sub-features

- `exercise-browser` — choose a muscle group and exercise; "Back to progress" returns with the group selection preserved.
- `weight-progression` — weekly maximum weight from completed sets with at least 4 reps, with 3 months, 6 months, 1 year, and All time ranges.
- `recent-sets` — expand "Recent sets" to see completed weights, reps, completion times, and available PR badges.
- `personal-records` — exercise details show separate weight, single-set volume, and bodyweight reps cards when those records exist. Large values use the primary color; cards have consistent spacing, no achieved dates, and no navigation action.

## How to get to it (user POV)

- Navbar ("Main navigation") → "Progress" → `/progress`.
- Progress → a muscle group → an exercise → "Personal records".

## Driving it with drive.mjs

Preconditions: doctor authenticated; exercise records require a saved workout with completed sets (see `create-workout.md`).

- **Renders:** `flow --out progress --steps '[{"goto":"/progress"},{"expectText":"Your progress"},{"screenshot":"01-progress.png"},{"snapshot":true}]'` → heading and muscle-group browser visible.
- **Record cards:** create completed Bench Press sets through the workout form with 8 kg × 12 reps and 0 kg × 20 reps, then run `flow --out personal-records --steps '[{"goto":"/progress"},{"wait":1000},{"click":{"name":"Chest","exact":true}},{"click":{"name":"Bench Press","exact":true}},{"expectText":"Weight PR"},{"expectText":"Volume PR"},{"expectText":"Reps PR"},{"expectText":"96"},{"expectText":"Bodyweight"},{"screenshot":"records-mobile.png"},{"snapshot":true}]'`. With no higher existing records, verify 8 kg, 96 kg, and 20 reps. Check matching primary colors and spacing, supporting set details, and no achieved dates.

- **Exercise controls:** after a completed Bench Press set, run `flow --out progress-controls --steps '[{"goto":"/progress"},{"wait":1000},{"click":{"name":"Chest","exact":true}},{"click":{"name":"Bench Press","exact":true}},{"expectText":"Weight progression"},{"click":{"role":"combobox","name":"Progression time range"}},{"click":{"role":"option","name":"All time","exact":true}},{"expectText":"All time"},{"click":{"name":"Recent sets","exact":true}},{"expectText":"Completed"},{"screenshot":"progress-controls.png"},{"snapshot":true},{"click":{"role":"link","name":"Back to progress"}},{"expectText":"Bench Press"},{"screenshot":"picker-restored.png"}]'`.

## Gotchas

- Exercise records are user-scoped; never cross-check against the real account's numbers.
