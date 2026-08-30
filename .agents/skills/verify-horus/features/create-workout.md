# Create a workout

From `/workouts/new` the user logs a workout: add one or more exercises (picked by name from the exercise search), fill per-set weight (kg) and reps, mark sets complete (which starts a Rest Timer overlay), then finish via a "Save Workout" dialog. Saving shows a "Saved <name>" toast, redirects to `/workouts`, and persists the workout, its exercises and sets to Neon — with any PRs toasted individually.

## Sub-features

- `add-exercise` — "Add Exercise" appends an exercise form; exercise name chosen via the input dropdown (search-backed combobox "Enter an exercise...").
- `log-sets` — per-set `kg`/`reps` inputs; completing a set (checkbox "Color success") starts the "Rest Timer" dialog.
- `rest-timer` — completing a set opens dialog "Rest Timer" with a "FINISH REST" button; the page behind it is blocked until dismissed.
- `save` — top-bar "Finish" opens the "Save Workout" dialog; "Save" persists and redirects to `/workouts`.
- `edit-existing` — `/workouts/<id>/edit` loads the saved workout for changes (drive like create, with the name pre-filled).
- `auth-gate` — signed-out users get "You need an account to create and save workouts." in the dialog and a "Sign in" link to `/login`.

## How to get to it (user POV)

- Dashboard "Start Workout" button → `/workouts/new`.
- Navbar → History → a workout card's options (`aria-label="Workout options"`) → "Edit" → `/workouts/<id>/edit`.

## Driving it with drive.mjs

Preconditions: doctor authenticated; note the verify user's `workouts` row count before the run.

- **Create and save a workout** (verified working end to end; this exact sequence passed all steps):
  ```json
  [
  	{ "goto": "/workouts/new" },
  	{ "wait": 2000 },
  	{ "fill": { "placeholder": "Enter an exercise...", "value": "Bench Press" } },
  	{ "wait": 1200 },
  	{ "click": { "role": "option", "name": "Bench Press" } },
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
- **Signed-out gate:** with no session, the Save dialog shows "You need an account to create and save workouts." and a "Sign in" link instead of Save/Cancel.

## Gotchas

- **Rest Timer blocks everything**: completing a set opens the "Rest Timer" dialog and the page behind it is inert — clicking "Finish" silently does nothing until you click "FINISH REST". Always dismiss it right after completing a set.
- **Hydration race on first click**: clicking "Finish" immediately after `goto` can fire before React attaches handlers (the duration timer ticking is not proof the dialog wiring is ready). Keep a `{"wait": 2000}` after `goto` before interacting.
- The save dialog's name input has NO working label association — use `{"fill": {"name": "Enter workout name", ...}}` (role + accessible name), not `{"label": ...}`. Its placeholder is dynamic (`"<CurrentDay> Workout"`).
- Exercise name: type into combobox "Enter an exercise...", wait ~1200ms for the debounced search, then click the matching `role=option`. Free text is kept if you dismiss the dropdown, but selecting the option is the reliable path.
- Set completion is the checkbox "Color success" (odd accessible name — it is a color-swatch toggle). Heatmap/PR aggregates only count completed sets.
- Submit validation requires weight AND reps on every set and at least one exercise; invalid submits scroll to the first invalid exercise and stay on the form.
- The duration timer starts on page load and is saved as `duration_seconds`.
- Cleanup: this feature creates rows — delete the verify user's workouts afterwards (SKILL.md Cleanup).
