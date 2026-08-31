---
name: verify-horus
description: "Verify Horus (Next.js gym workout tracker web app) end to end by driving the real UI at localhost:8000 like a user — login session, dashboard, workout create/edit, history, progress, settings. Use when a feature or bugfix needs behavioral proof, before pushing, or when the user asks to verify/e2e-check the app. Not a unit test suite: no vitest/playwright tests exist here."
---

# Verify Horus

Drive the real app the way a user does and capture evidence. The feature map in `features/` is the maintained list of what to verify — read the index, then the matching feature file, before driving.

## Launch

The app is a Next.js 16 dev server on `http://localhost:8000` (`pnpm dev`, binds `127.0.0.1`).

- **Attach first**: the user usually has the dev server running. Check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000` — `200`/`307` means attach to it. **Never start a second instance** and never kill one you didn't start.
- Only if nothing answers: start `pnpm dev` from the repo root in the background, note the PID, and wait until the port answers. Tear that instance down on cleanup by killing the PID you recorded. Port 8000 is also claimed by `tailscale serve` (HTTPS on the tailnet IP); that is a proxy, not the app — do not touch it.
- Env lives in `.env.local` (t3env-validated). External deps are real: Neon dev Postgres, Upstash Redis, Resend, OAuth. Writing rows is acceptable (dev DB), but only as the verify user (see Doctor).

## Doctor

Run first, and whenever anything looks off. One command answers both "is the app worth driving?" and "is the profile authenticated?":

```
node .agents/skills/verify-horus/helpers/drive.mjs doctor
```

It loads the app in a headless Chromium (mobile viewport) using the persistent profile at `/tmp/horus-verify-profile` and prints `app:` and `session:`. All verification runs as the dedicated **verify user** (`verify-agent@horus.local`) — never drive the user's real account.

If `session: NOT authenticated`, run `helpers/drive.mjs auth`. This inserts the verify user and a session row in the dev DB and injects the signed `better-auth.session_token` cookie into the profile (better-auth always signs this cookie: `token.base64(hmac-sha256(token, BETTER_AUTH_SECRET))`). Then re-run `doctor`. Only if minting fails, fall back to `helpers/drive.mjs login` (opens a headed window; the human completes the OTP that Resend delivers to their email) — but a profile authenticated via `login` holds the **user's real account**, so do not create or delete data in that session.

## Drive

All driving goes through the harness — one Chromium launch per flow, persistent profile keeps the session:

```
node .agents/skills/verify-horus/helpers/drive.mjs flow --out <run-label> --steps '<JSON array>'
```

Steps (JSON objects), all grounded in this repo's UI:

- `{"goto": "/workouts/new"}` — relative to `http://localhost:8000`
- `{"click": {"name": "Finish"}}` — role defaults to `button`; add `"role"` for links (`{"role": "link", "name": "Start Workout"}`) or `"exact": true`
- `{"fill": {"placeholder": "kg", "value": "60"}}` — or by `{"label": ...}` / `{"name": ...}` (accessible name)
- `{"press": "Enter"}`
- `{"expectText": "Year in Training"}`, `{"expectToast": "Saved ..."}` (sonner toasts), `{"expectUrl": "/workouts"}`
- `{"screenshot": "01-after-save.png"}` (full-page, into the evidence dir)
- `{"snapshot": true}` — ARIA snapshot saved as `step-N-aria-snapshot.yml`
- `{"text": true}` — prints `document.body.innerText`
- `{"wait": 500}`, `{"sessionDump": true}` (prints get-session JSON)

Prefer accessible names — this repo has few stable handles: `aria-label="Main navigation"` (nav), `aria-label="Workout options"` (history card menu), `aria-label="Recent exercises"` (form dropdown), placeholders `Search by workout name`, `Enter an exercise...`, `kg`, `reps`. Radix selects/dialogs need two clicks (trigger, then option/dialog content) — allow a `{"wait": 300}` between if flaky.

## Evidence

Proofs go to `.agents/skills/verify-horus/evidence/<run-label>/` (git-ignored, survives cleanup — never delete old runs). Proof standards:

- Exercise the **real user path** (buttons, forms, navigation) — never internal stores, test-only endpoints, or direct API mutations to set up state you then "verify".
- Capture the **action and the resulting state**: a screenshot after the action plus a positive assertion (`expectText`/`expectToast`/`expectUrl`) that only passes if it worked.
- **Verify side effects in the DB**, not just the screen. The workout save path writes to Neon; confirm with:
  ```
  node .agents/skills/verify-horus/helpers/db-query.mjs --sql "SELECT id, name, created_at FROM workouts WHERE user_id = 'verify-agent' ORDER BY created_at DESC LIMIT 5"
  ```
  (`db-query.mjs` refuses non-SELECT queries without `--yes`; use it for cleanup deletes too.)
- Record the run label, feature ID, and entry point used. A skipped path is not verified — report it as skipped.

## Cleanup

- Never kill processes by name. If the run started the dev server, kill only the recorded PID; if it attached, do nothing.
- Delete DB rows the run created, scoped to the verify user (e.g. `DELETE FROM workouts WHERE user_id = 'verify-agent'` with `--yes`; cascades to `workout_exercises`/`workout_sets`), unless the user asked to keep them.
- Close any headed `login` window. Evidence stays; the persistent profile at `/tmp/horus-verify-profile` stays (it holds the session cookie).
- Do not sign out or delete the verify user's session unless the test is specifically about sign-out — re-run `auth` afterwards if so.

## Helpers

- `helpers/drive.mjs` — `auth | doctor | session-dump | login | flow --out <label> --steps '<json>'` (auto-installs playwright-core into `helpers/node_modules` on first use; uses Playwright's bundled Chromium from `~/.cache/ms-playwright`).
- `helpers/db-query.mjs` — SQL probe against the dev Neon DB (`--sql "..."`, `--yes` for writes). Reads `DATABASE_URL` from `.env.local`.
- `features/` — the maintained verification map. Keep it updated when routes, labels, or flows change.
