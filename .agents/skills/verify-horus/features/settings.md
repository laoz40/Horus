# Settings

`/settings` holds the account bar (name/email linking to account), theme dropdown, notifications toggle, exercise catalog link, and data management including inline sign-out and "Delete all workouts". `/settings/account` holds better-auth account/security cards, the explicit "Sign out" card, and "Delete user". Several actions here are destructive — they act on the signed-in user, which must be the verify user.

## Sub-features

- `account-bar` — SettingsAccountSection shows the signed-in identity; chevron row labeled "Account" links to `/settings/account`.
- `theme` — ModeToggle dropdown (Light / Dark / Black / System); choice persists across reloads.
- `notifications` — rest-timer notifications toggle on `/settings`.
- `exercises` — "Exercises" row links to `/settings/exercises` (catalog CRUD).
- `delete-all-workouts` — confirm dialog "Delete all workouts?" removes every workout for the signed-in user; success toast is `Deleted N workout(s)`.
- `sign-out-main` — inline "Sign out" button on `/settings` (SettingsDataSection).
- `sign-out-account` — "Sign out" card on `/settings/account` (detailed in `session-auth.md`).
- `delete-account` — better-auth "Delete user" card permanently removes the verify user (last resort; requires re-minting user+session afterwards).

## How to get to it (user POV)

- Navbar → "Settings" → `/settings`; account bar → `/settings/account`.

## Driving it with drive.mjs

Preconditions: doctor authenticated as verify-agent@horus.local. **Stop and re-verify the session email before any destructive step.**

- **Account bar:** `flow --out settings --steps '[{"goto":"/settings"},{"expectText":"Settings"},{"expectText":"verify-agent@horus.local"},{"expectText":"Account"},{"screenshot":"01-settings.png"}]'` → identity visible.
- **Theme:** open the theme dropdown (trigger shows current mode, e.g. "Light"; `sr-only` "Toggle theme"), pick an option from snapshot, reload, screenshot again.
- **Delete all workouts:** seed 1+ workouts via `create-workout.md`, note the DB count, then `{"goto":"/settings"},{"click":{"name":"Delete all workouts"}}` → dialog "Delete all workouts?" / "This will permanently delete all workouts." → confirm with **Delete** → toast `Deleted N workout(s)`; DB query `SELECT count(*) FROM workouts WHERE user_id = 'verify-agent'` returns `0`.

## Gotchas

- "Delete all workouts" and "Delete user" are real destructive mutations scoped to the signed-in user. Never run them unless the doctor output in the same minute confirmed the verify user — if a manual `login` (real account) was used, do NOT drive these.
- `delete-account` removes the verify user row; workouts cascade. Recreating it requires `drive.mjs auth` (which re-inserts the user) — expect that, don't treat it as a failure.
- Theme control is a labeled dropdown, not a lone icon button — read the snapshot for the current mode label before clicking.
