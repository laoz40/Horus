# Progress

`/progress` is a focused view of the "Year in Training" heatmap: one cell per day, colored by number of completed sets logged on workouts created that day in the current year. It is the read-only aggregate of everything logged elsewhere.

## Sub-features

- `heatmap` — section titled "Year in Training" renders with the current year.
- `counts` — days with completed sets show non-zero counts; matches `getYearInTraining.sql` (groups by `workouts.created_at`, not `workout_sets.created_at`).
- `personal-records` — exercise details show separate weight, single-set volume, and bodyweight reps cards when those records exist. Large values use the primary color; cards have consistent spacing, no achieved dates, and no navigation action.

## How to get to it (user POV)

- Navbar ("Main navigation") → "Progress" → `/progress`.
- Progress → a muscle group → an exercise → "Personal records".

## Driving it with drive.mjs

Preconditions: doctor authenticated; non-empty counts require a saved workout with completed sets (see `create-workout.md`).

- **Renders:** `flow --out progress --steps '[{"goto":"/progress"},{"expectText":"Year in Training"},{"screenshot":"01-progress.png"},{"snapshot":true}]'` → header and heatmap (or empty-state copy) visible.
- **Counts check:** after creating a workout with N completed sets today, the heatmap should reflect today's day cell; compare against:
  `node .agents/skills/verify-horus/helpers/db-query.mjs --sql "SELECT count(*) FROM workout_sets s JOIN workout_exercises e ON s.workout_exercise_id = e.id JOIN workouts w ON e.workout_id = w.id WHERE w.user_id = 'verify-agent' AND s.completed"`
- **Record cards:** create completed Bench Press sets through the workout form with 8 kg × 12 reps and 0 kg × 20 reps, then run `flow --out personal-records --steps '[{"goto":"/progress"},{"wait":1000},{"click":{"name":"Chest","exact":true}},{"click":{"name":"Bench Press","exact":true}},{"expectText":"Weight PR"},{"expectText":"Volume PR"},{"expectText":"Reps PR"},{"expectText":"96"},{"expectText":"Bodyweight"},{"screenshot":"records-mobile.png"},{"snapshot":true}]'`. With no higher existing records, verify 8 kg, 96 kg, and 20 reps. Check matching primary colors and spacing, supporting set details, and no achieved dates.

## Gotchas

- A fresh verify user sees empty-state copy ("Your consistency map starts with your next session.") — that is correct, not a bug; seed via `create-workout.md` to prove counts.
- Heatmap aggregates are user-scoped; never cross-check against the real account's numbers.
