# Settings

`/settings` holds the account bar (name/email), the theme toggle, and data management including "Delete all workouts". `/settings/account` holds better-auth account/security cards, the explicit "Sign out" card, and "Delete user". Several actions here are destructive — they act on the signed-in user, which must be the verify user.

## Sub-features

- `account-bar` — SettingsAccountSection shows the signed-in identity (Settings → "My Account").
- `theme` — ModeToggle switches light/dark; choice persists across reloads.
- `delete-all-workouts` — confirm dialog "Delete all workouts?" removes every workout for the signed-in user.
- `sign-out` — "Sign out" card on `/settings/account` ends the session (detailed in `session-auth.md`).
- `delete-account` — better-auth "Delete user" card permanently removes the verify user (last resort; requires re-minting user+session afterwards).

## How to get to it (user POV)

- Navbar → "Settings" → `/settings`; "My Account" → `/settings/account`.

## Driving it with drive.mjs

Preconditions: doctor authenticated as verify-agent@horus.local. **Stop and re-verify the session email before any destructive step.**

- **Account bar:** `flow --out settings --steps '[{"goto":"/settings"},{"expectText":"Settings"},{"expectText":"verify-agent@horus.local"},{"screenshot":"01-settings.png"}]'` → identity visible.
- **Theme:** `{"goto":"/settings"},{"click":{"name":"...toggle label from snapshot..."}},{"screenshot":"02-theme.png"},{"wait":300},{"goto":"/settings"},{"screenshot":"03-theme-persisted.png"}` → html class/coloring changes and survives reload.
- **Delete all workouts:** seed 1+ workouts via `create-workout.md`, note the DB count, then `{"goto":"/settings"},{"click":{"name":"Delete all workouts"}}` → dialog "Delete all workouts?" / "This will permanently delete all workouts." → confirm → toast; DB query `SELECT count(*) FROM workouts WHERE user_id = 'verify-agent'` returns `0`.

## Gotchas

- "Delete all workouts" and "Delete user" are real destructive mutations scoped to the signed-in user. Never run them unless the doctor output in the same minute confirmed the verify user — if a manual `login` (real account) was used, do NOT drive these.
- `delete-account` removes the verify user row; workouts cascade. Recreating it requires `drive.mjs auth` (which re-inserts the user) — expect that, don't treat it as a failure.
- The theme toggle's accessible name comes from the snapshot; it is an icon button, so check `snapshot` output first.
