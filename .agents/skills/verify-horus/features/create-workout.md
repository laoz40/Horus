# Create a workout

From `/workouts/new` the user logs a workout: pick an exercise via the muscle-group grid (Chest, Back, …) or the search combobox (`aria-label="Exercise name"`), fill per-set weight (kg) and reps, mark sets complete (which starts a Rest Timer drawer), then finish via a "Save Workout" dialog. Saving shows a "Saved <name>" toast, redirects to `/workouts`, and persists the workout, its exercises and sets to Neon — PR toasts fire on set completion, not on save.

## Sub-features

- `pick-exercise-grid` — with no exercise name yet, tap a muscle-group button (e.g. "Chest"), then an exercise button (e.g. "Bench Press").
- `pick-exercise-search` — type in the combobox (`{"fill":{"combobox":"Exercise name","value":"Bench Press"}}`), wait for debounced search, click the matching `role=option`.
- `log-sets` — per-set `kg`/`reps` inputs; completing a set (checkbox "Color success") starts the "Rest Timer" drawer.
- `rest-timer` — completing a set opens drawer "Rest Timer" with a "FINISH REST" button; the page behind it is blocked until dismissed.
- `save` — top-bar "Finish" opens the "Save Workout" dialog; "Save" persists and redirects to `/workouts`.
- `edit-existing` — `/workouts/<id>/edit` loads the saved workout for changes (drive like create, with the name pre-filled).
- `auth-gate` — signed-out users see a "Not Signed In" alert on the form; the Save dialog shows "You need an account to create and save workouts." and a "Sign in" link to `/login`.

## How to get to it (user POV)

- Dashboard "Start Workout" button → `/workouts/new`.
- Navbar → History → a workout card's options (`aria-label="Workout options"`) → "Edit" → `/workouts/<id>/edit`.

## Driving it with drive.mjs

Preconditions: doctor authenticated; note the verify user's `workouts` row count before the run.

- **Create and save a workout** (muscle-group path; verified working):
  ```json
  [
  	{ "goto": "/workouts/new" },
  	{ "wait": 2000 },
  	{ "click": { "name": "Chest" } },
  	{ "wait": 800 },
  	{ "click": { "name": "Bench Press" } },
  	{ "fill": { "placeholder": "kg", "value": "60" } },
  	{ "fill": { "placeholder": "reps", "value": "8" } },
  	{ "click": { "role": "checkbox", "name": "Color success" } },
  	{ "click": { "name": "FINISH REST" } },
  	{ "click": { "name": "Finish" } },
  	{ "wait": 800 },
  	{ "fill": { "name": "Enter workout name", "value": "Verify Run Workout" } },
  	{ "click": { "name": "Save" } },
  	{ "expectToast": "Saved Verify Run Workout" },
  	{ "expectUrl": "/workouts" },
  	{ "screenshot": "03-after-save.png" }
  ]
  ```
- **DB side effect:**
  `node .agents/skills/verify-horus/helpers/db-query.mjs --sql "SELECT w.id, w.name, w.duration_seconds FROM workouts w WHERE w.user_id = 'verify-agent' ORDER BY w.created_at DESC LIMIT 3"`
  → the new row exists. Sets via the `workout_sets`/`workout_exercises` joins (`weight`, `reps`, `completed`).
- **Read-back proof:** `flow --out create-readback --steps '[{"goto":"/workouts"},{"expectText":"Verify Run Workout"},{"screenshot":"04-history-readback.png"}]'`.

## Gotchas

- **Rest Timer blocks everything**: completing a set opens the "Rest Timer" drawer and the page behind it is inert — clicking "Finish" silently does nothing until you click "FINISH REST". Always dismiss it right after completing a set.
- **Hydration race on first click**: clicking "Finish" immediately after `goto` can fire before React attaches handlers. Keep a `{"wait": 2000}` after `goto` before interacting.
- The save dialog name field is labeled "Enter workout name" — use `{"fill": {"name": "Enter workout name", ...}}`.
- Combobox search placeholder is "Search an exercise..." but the reliable handle is `combobox` + `"Exercise name"`.
- Set completion is the checkbox "Color success" (color-swatch toggle). Heatmap/PR aggregates only count completed sets.
- Submit validation requires weight AND reps on every set and at least one exercise; invalid submits scroll to the first invalid exercise and stay on the form.
- The duration timer starts on page load and is saved as `duration_seconds`.
- Cleanup: this feature creates rows — delete the verify user's workouts afterwards (SKILL.md Cleanup).
