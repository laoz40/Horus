# Dashboard

The dashboard (`/`) is the home screen: a personalized greeting, a "Start" section that begins a workout, a disabled-in-waiting presets action, and the "Year in Training" heatmap of completed sets per day. Signed-out visitors see "Welcome," and "Legend" instead of their name.

## Sub-features

- `greeting` — signed-in shows "Welcome back," + verify user's name; signed-out shows "Welcome," + "Legend".
- `start-workout` — "Start Workout" navigates to `/workouts/new`.
- `presets-stub` — "Create a Preset" shows the info toast "Presets are coming soon."
- `year-in-training` — heatmap section titled "Year in Training" renders (empty for a fresh verify user).

## How to get to it (user POV)

- App root `/` (navbar item "Workout", `aria-label="Main navigation"`).

## Driving it with drive.mjs

Preconditions: doctor authenticated.

- **Greeting:** `flow --out dashboard --steps '[{"goto":"/"},{"expectText":"Welcome back"},{"snapshot":true},{"screenshot":"01-dashboard.png"}]'` → "Welcome back," visible; snapshot shows the section structure.
- **Start Workout:** same flow, then `{"click":{"role":"link","name":"Start Workout"}},{"expectUrl":"/workouts/new"}` → URL changes to the workout form.
- **Presets stub:** `{"goto":"/"},{"click":{"role":"link","name":"Create a Preset"}},{"expectToast":"Presets are coming soon."}` → toast appears. (It renders as a `role=link` — `Button asChild` wrapping a `Link`.)
- **Heatmap:** `{"goto":"/"},{"expectText":"Year in Training"}` → section header present. To see it non-empty, complete `create-workout` first (needs at least one completed set today).

## Gotchas

- The greeting is client-rendered from the session; allow the skeleton to resolve — `expectText` polls up to 10s, which is enough.
- "Welcome" alone also matches signed-out text; assert `"Welcome back"` for the authenticated case.
- Heatmap counts only sets with `completed = true`; uncompleted sets never show up.
