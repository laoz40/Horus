# Progress

`/progress` is a focused view of the "Year in Training" heatmap: one cell per day, colored by number of completed sets. It is the read-only aggregate of everything logged elsewhere.

## Sub-features

- `heatmap` — section titled "Year in Training" renders with the current year.
- `counts` — days with completed sets show non-zero counts; matches `SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD'), count(*) FROM workout_sets ... WHERE completed` aggregated through workouts/workout_exercises joins.

## How to get to it (user POV)

- Navbar ("Main navigation") → "Progress" → `/progress`.

## Driving it with drive.mjs

Preconditions: doctor authenticated; non-empty counts require a saved workout with completed sets (see `create-workout.md`).

- **Renders:** `flow --out progress --steps '[{"goto":"/progress"},{"expectText":"Year in Training"},{"screenshot":"01-progress.png"},{"snapshot":true}]'` → header and heatmap canvas/legend visible.
- **Counts check:** after creating a workout with N completed sets today, the heatmap should reflect today's day cell; compare against:
  `node .agents/skills/verify-horus/helpers/db-query.mjs --sql "SELECT count(*) FROM workout_sets s JOIN workout_exercises e ON s.workout_exercise_id = e.id JOIN workouts w ON e.workout_id = w.id WHERE w.user_id = 'verify-agent' AND s.completed"`.

## Gotchas

- A fresh verify user has an empty heatmap — that is correct behavior, not a bug; seed via `create-workout.md` to prove counts.
- Heatmap aggregates are user-scoped; never cross-check against the real account's numbers.
