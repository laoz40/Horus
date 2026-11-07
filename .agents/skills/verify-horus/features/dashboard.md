# Dashboard

The dashboard (`/`) is the home screen: a personalized greeting, the "Year in Training" heatmap of completed sets per day, a Workout history button, then the "Presets" section and Create a Preset button. Floating navigation groups Workouts and Progress on the left, with a separate circular Start Workout link on the right. Signed-out visitors see "Welcome," and "Legend" instead of their name.

## Sub-features

- `greeting` — signed-in shows "Welcome back," + verify user's name ("Verify Agent"); signed-out shows "Welcome," + "Legend".
- `sign-in-prompt` — signed-out visitors see "Not Signed In"; "Let me test" dismisses it, and "Sign in" opens `/login`. Starting a workout after dismissal does not show a second prompt.
- `start-workout` — "Start Workout" navigates to `/workouts/new`.
- `presets-stub-create` — "Create a Preset" below the presets shows the info toast "Presets are coming soon."
- `history` — Workout history below the year view opens `/workouts`.
- `presets-stub-section` — "COMING SOON" in the Presets section shows "Please read. Please be patient. 😠".
- `year-in-training` — heatmap section titled "Year in Training" renders (empty for a fresh verify user); the "Training year" combobox selects years from the user's training history.

## How to get to it (user POV)

- App root `/` (navbar item "Workouts", `aria-label="Main navigation"`).

## Driving it with drive.mjs

Preconditions: doctor authenticated.

- **Greeting + heatmap + preset stubs:**
  `flow --out dashboard --steps '[{"goto":"/"},{"expectText":"Welcome back"},{"expectText":"Verify Agent"},{"expectText":"Year in Training"},{"click":{"role":"button","name":"Create a Preset"}},{"expectToast":"Presets are coming soon."},{"click":{"name":"COMING SOON"}},{"expectToast":"Please read. Please be patient."},{"screenshot":"01-dashboard.png"},{"snapshot":true}]'`
  → greeting and both preset toasts fire.
- **Start Workout:** `flow --out dashboard-start --steps '[{"goto":"/"},{"click":{"role":"link","name":"Start Workout"}},{"expectUrl":"/workouts/new"}]'` → URL changes to the workout form.
- **Nonempty heatmap:** complete `create-workout.md` first (needs at least one completed set today).

## Gotchas

- The greeting is client-rendered from the session; allow the skeleton to resolve — `expectText` polls up to 10s, which is enough.
- "Welcome" alone also matches signed-out text; assert `"Welcome back"` for the authenticated case.
- Both preset buttons are clickable (not disabled); each shows a different info toast.
- Heatmap counts only sets with `completed = true`; uncompleted sets never show up.
