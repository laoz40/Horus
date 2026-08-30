# Horus verification map

This directory is the maintained source for verifying the user-facing behavior of Horus, a mobile-first gym workout tracker. Read this index before driving, then use the matching feature file as the recipe.

## Baseline preconditions

- App reachable at `http://localhost:8000` (user's dev server, or one started by the run — see SKILL.md Launch).
- `node .agents/skills/verify-horus/helpers/drive.mjs doctor` reports `app: up` and `session: authenticated` (as the verify user `verify-agent@horus.local`). If unauthenticated, run `helpers/drive.mjs auth` then `doctor` again.
- Never drive the user's real account; all created data belongs to the verify user.

## Driving conventions

- Start every recipe from the baseline preconditions unless its file says otherwise.
- Prefer accessible names and placeholders over CSS selectors or coordinates; exact handles are in each feature file.
- Run all browser actions through `helpers/drive.mjs flow`; run DB observations through `helpers/db-query.mjs`.
- The app is mobile-first: the harness already drives at a phone-size viewport.
- Mutations must be proven with a second, read-only view of the result (revisit list page, DB query) — never trust a single toast.
- Clean up created rows afterwards (SKILL.md Cleanup); never delete proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen: screenshots + ARIA snapshot + a positive assertion per action.
- UI proof: screenshot with app identity visible, plus `expectText`/`expectToast`/`expectUrl` output in the run log.
- Mutation proof: DB query showing the inserted/changed row (scoped to `user_id = 'verify-agent'`).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted steps and the unmet precondition. Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file has an H1 title, one paragraph describing the user-visible behavior, and exactly four H2 sections in this order:

1. `Sub-features` — short IDs, one line each.
2. `How to get to it (user POV)` — every user entry point.
3. `Driving it with drive.mjs` — starts with `Preconditions:`, labeled bullets pairing each user action with an exact step JSON and the observable result.
4. `Gotchas` — traps that can waste or invalidate a run.

Keep implementation details out: user paths, stable handles, required state, commands, observable proof only.

## Features

- [Session and auth](./session-auth.md) — session precondition, OTP login, sign out.
- [Dashboard](./dashboard.md) — greeting, Start Workout, presets stub, Year in Training heatmap.
- [Create a workout](./create-workout.md) — add exercises, sets, save, DB persistence, PR toast.
- [Workout history](./workout-history.md) — list, search, edit, delete, pagination.
- [Progress](./progress.md) — Year in Training page.
- [Settings](./settings.md) — account bar, theme, data management, sign out, account deletion.
