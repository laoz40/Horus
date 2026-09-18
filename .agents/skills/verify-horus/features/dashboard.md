# Dashboard

The dashboard (`/`) is the home screen: a personalized greeting, a "Start" section that begins a workout or stubs preset creation, a separate "Presets" section with its own coming-soon button, and the "Year in Training" heatmap of completed sets per day. Signed-out visitors see "Welcome," and "Legend" instead of their name.

## Sub-features

- `greeting` — signed-in shows "Welcome back," + verify user's name ("Verify Agent"); signed-out shows "Welcome," + "Legend".
- `start-workout` — "Start Workout" navigates to `/workouts/new`.
- `presets-stub-start` — "Create a Preset" in the Start section shows the info toast "Presets are coming soon."
- `presets-stub-section` — "COMING SOON" in the Presets section shows "Please read. Please be patient. 😠".
- `year-in-training` — heatmap section titled "Year in Training" renders (empty for a fresh verify user).

## How to get to it (user POV)

- App root `/` (navbar item "Workout", `aria-label="Main navigation"`).

## Driving it with drive.mjs

Preconditions: doctor authenticated.

- **Greeting + heatmap + preset stubs:**
  `flow --out dashboard --steps '[{"goto":"/"},{"expectText":"Welcome back"},{"expectText":"Year in Training"},{"click":{"role":"link","name":"Create a Preset"}},{"expectToast":"Presets are coming soon."},{"click":{"name":"COMING SOON"}},{"expectToast":"Please read. Please be patient."},{"screenshot":"01-dashboard.png"},{"snapshot":true}]'`
  → greeting and both preset toasts fire.
- **Start Workout:** `flow --out dashboard-start --steps '[{"goto":"/"},{"click":{"role":"link","name":"Start Workout"}},{"expectUrl":"/workouts/new"}]'` → URL changes to the workout form.
- **Nonempty heatmap:** complete `create-workout.md` first (needs at least one completed set today).

## Gotchas

- The greeting is client-rendered from the session; allow the skeleton to resolve — `expectText` polls up to 10s, which is enough.
- "Welcome" alone also matches signed-out text; assert `"Welcome back"` for the authenticated case.
- Both preset buttons are clickable (not disabled); each shows a different info toast.
- Heatmap counts only sets with `completed = true`; uncompleted sets never show up.
