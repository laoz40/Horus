---
name: verify-horus
description: "Verify Horus (Next.js gym workout tracker web app) end to end by driving the real UI at localhost:8000 like a user — login session, dashboard, workout create/edit, history, progress, settings. Use when a feature or bugfix needs behavioral proof, before pushing, or when the user asks to verify/e2e-check the app. Use the skill-owned browser helpers for this pass; the separate Playwright suite lives in tests/."
---

# Verify Horus

Drive the real app the way a user does and capture evidence. The feature map in `features/` is the maintained list of what to verify — read the index, then the matching feature file, before driving.

## Launch

The app runs on `http://localhost:8000` and binds `127.0.0.1`. Choose the launch mode explicitly. An HTTP response proves availability, not that a server is running current source.

### Current-source development verification

- Check whether port 8000 is occupied before starting anything. Attach only after identifying the listener as `next dev` from this checkout, using its process command and working directory. An unknown listener or an existing `next start` is not current-source proof. Stop and ask its owner to free the port; never kill a server the run did not start.
- If nothing is listening, start `pnpm dev` from this checkout, record the process ownership, and wait for readiness. Tear down only that run's server and children on completion or failure. Port 8000 is also claimed by `tailscale serve` on the tailnet IP; that is a proxy, not the app. Do not touch it.
- `pnpm test` and `pnpm verify` now refuse an occupied app port by default. To reuse an identified user-owned dev server for Playwright, explicitly run `HORUS_TEST_SERVER=attach pnpm test` or `HORUS_TEST_SERVER=attach pnpm verify`. Attached servers remain running afterward.
- Env lives in `.env.local` (t3env-validated). External deps are real: Neon dev Postgres, Upstash Redis, Resend, OAuth. Writing rows is acceptable (dev DB), but only as the verify user for skill-driven flows (see Doctor). The Playwright suite uses its separate E2E user.

### Fresh-production verification

From this checkout, with port 8000 free, run:

```sh
pnpm test:production
```

This uses Playwright's existing server lifecycle to run `pnpm build && pnpm start` before the existing E2E suite. It rebuilds current source every time and never reuses a listener. Playwright owns the launched process group and tears it down on success, failure, or interruption. An occupied port fails the run without killing or attaching to the existing server. Do not run another dev server or edit source during the build and verification.

For additional skill-driven browser flows against a fresh production build, use two terminals. In the first, confirm port 8000 is free, then run `pnpm build && pnpm start` in the foreground from this checkout. Record that this terminal owns the server. After it reports ready, run `doctor` and the needed flows in the second terminal. Stop the owned server with Ctrl-C when finished, including after failed flows, and confirm it released the port. Do not reuse a production server whose build and launch were not part of this run.

CI already builds before production E2E and owns its server in the workflow. This local path does not change CI.

## Doctor

Run first, and whenever anything looks off. One command answers both "is the app worth driving?" and "is the profile authenticated?":

```
node .agents/skills/verify-horus/helpers/drive.mjs doctor
```

It loads the app in a headless Chromium (mobile viewport) using the persistent profile at `/tmp/horus-verify-profile` and prints `app:` and `session:`. All verification runs as the dedicated **verify user** (`verify-agent@horus.local`) — never drive the user's real account.

If `session: NOT authenticated`, run `helpers/drive.mjs auth`. This inserts the verify user and a session row in the dev DB and injects the signed `better-auth.session_token` cookie into the profile (better-auth always signs this cookie: `token.base64(hmac-sha256(token, BETTER_AUTH_SECRET))`). Then re-run `doctor`. Only if minting fails, fall back to `helpers/drive.mjs login` (opens a headed window; the human completes the OTP that Resend delivers to their email) — but a profile authenticated via `login` holds the **user's real account**, so do not create or delete data in that session.

## Drive

Run `doctor` before each flow, since each flow opens a fresh browser session. After a failed flow, run `doctor` again and start the retry from a known route. Keep screenshots and snapshots from failed attempts.

All driving goes through the harness — one Chromium launch per flow, persistent profile keeps the session:

```
node .agents/skills/verify-horus/helpers/drive.mjs flow --out <run-label> --steps '<JSON array>'
```

Steps (JSON objects), all grounded in this repo's UI:

- `{"goto": "/workouts/new"}` — relative to `http://localhost:8000`
- `{"click": {"name": "Finish"}}` — role defaults to `button`; add `"role"` for links (`{"role": "link", "name": "Start Workout"}`) or `"exact": true`
- `{"fill": {"placeholder": "kg", "value": "60"}}` — or by `{"label": ...}` / `{"name": ...}` (textbox accessible name) / `{"combobox": "Exercise name", "value": "..."}` (combobox)
- `{"press": "Enter"}`
- `{"expectText": "Year in Training"}`, `{"expectToast": "Saved ..."}` (sonner toasts), `{"expectUrl": "/workouts"}`
- `{"screenshot": "01-after-save.png"}` (full-page, into the evidence dir)
- `{"snapshot": true}` — ARIA snapshot saved as `step-N-aria-snapshot.yml`
- `{"text": true}` — prints `document.body.innerText`
- `{"wait": 500}`, `{"sessionDump": true}` (prints get-session JSON)

Prefer accessible names — this repo has few stable handles: `aria-label="Main navigation"` (nav), `aria-label="Workout options"` (history card menu; use `click`, not `expectText`), muscle-group buttons (`Chest`, `Back`, …), combobox `Exercise name`, placeholders `kg`, `reps`. Input placeholders are not visible to `expectText`. Radix selects/dialogs need two clicks (trigger, then option/dialog content) — allow a `{"wait": 300}` between if flaky.

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

## SQL experiments with session-local temporary tables

Before using session-local temporary tables, run:

```sh
node .agents/skills/verify-horus/helpers/db-query.mjs --session-preflight
```

This requires `DATABASE_URL_UNPOOLED` in `.env.local`, rejects a Neon pooler hostname, and checks a temporary table across separate statements on one direct `pg.Client` connection. It closes that connection afterward, dropping the table, and never prints credentials. If the URL is missing or pooled, copy the direct connection URL with pooling disabled from Neon into `DATABASE_URL_UNPOOLED` and rerun the preflight.

A successful preflight does not make subsequent connections session-affine. The experiment must also use `DATABASE_URL_UNPOOLED` with **one connected `pg.Client`** for all temp-table statements, closing it in `finally`. Do not use Neon HTTP queries or separate pool calls for this work. Ordinary read-only `db-query.mjs --sql` probes and normal app queries continue using their usual pooled `DATABASE_URL`.

## Cleanup

- Never kill processes by name. If the run started the dev server, kill only the recorded PID; if it attached, do nothing.
- Delete DB rows the run created, scoped to the verify user (e.g. `DELETE FROM workouts WHERE user_id = 'verify-agent'` with `--yes`; cascades to `workout_exercises`/`workout_sets`), unless the user asked to keep them.
- Close any headed `login` window. Evidence stays; the persistent profile at `/tmp/horus-verify-profile` stays (it holds the session cookie).
- Do not sign out or delete the verify user's session unless the test is specifically about sign-out — re-run `auth` afterwards if so.

## Helpers

- `helpers/drive.mjs` — `auth | doctor | session-dump | login | flow --out <label> --steps '<json>'` (auto-installs playwright-core into `helpers/node_modules` on first use; uses Playwright's bundled Chromium from `~/.cache/ms-playwright`).
- `helpers/db-query.mjs` — SQL probe against the dev Neon DB (`--sql "..."`, `--yes` for writes), or `--session-preflight` before session-local temporary-table work. Reads `DATABASE_URL` for ordinary probes and `DATABASE_URL_UNPOOLED` for the preflight from `.env.local`.
- `features/` — the maintained verification map. Keep it updated when routes, labels, or flows change.
