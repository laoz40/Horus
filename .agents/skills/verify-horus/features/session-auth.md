# Session and auth

Horus has no passwords: users sign in with an email OTP (delivered by Resend) or OAuth (Google/GitHub). Pages check the session client-side via better-auth (`authClient.useSession`), so there is no redirect — an unauthenticated visitor sees signed-out UI instead. Verification runs authenticate a dedicated verify user by minting a session row in the dev DB (`drive.mjs auth`), which bypasses the email round-trip.

## Sub-features

- `doctor-session` — the profile cookie yields a valid session (`/api/auth/get-session` returns a user).
- `mint-session` — `drive.mjs auth` creates/reuses the verify user and injects a working session cookie.
- `otp-login` — manual: enter email on `/login`, receive OTP by email, enter code, land on `/welcome`.
- `sign-out` — from `/settings/account`, ends the session on this device.

## How to get to it (user POV)

- `/login` — the sign-in page (OTP form).
- Navbar → Settings → account section / "Sign out" card on `/settings/account`.

## Driving it with drive.mjs

Preconditions: app up; profile at `/tmp/horus-verify-profile` exists (created on first drive).

- **Check session (precondition for all other features):**
  `node .agents/skills/verify-horus/helpers/drive.mjs doctor`
  → `app: up`, `session: authenticated: verify-agent@horus.local`. If `NOT authenticated`, run `auth` (then `auth --signed` if still unauthenticated) and re-run `doctor`.
- **Mint session:** `node .agents/skills/verify-horus/helpers/drive.mjs auth` → "Minted plain session for verify-agent@horus.local".
- **OTP login (manual, headed):** `node .agents/skills/verify-horus/helpers/drive.mjs login` → window opens at `/login`; complete it by hand; script exits once get-session returns the user. Note: this signs in as the **user's real account**.
- **Sign out flow:**
  `flow --out signout --steps '[{"goto":"/settings/account"},{"click":{"name":"Sign out"}},{"expectText":"Welcome"},{"sessionDump":true}]'`
  → sessionDump prints `null`; dashboard shows "Welcome," without a name. Afterwards re-run `auth` to restore the verify session.

## Gotchas

- The login page is an EMAIL_OTP view; the code goes to the email typed in and expires after 5 minutes. Automation cannot read it — that is why minted sessions exist.
- `SITE_URL` is `http://localhost:8000`; better-auth validates the request Origin, so always drive `localhost`, never `127.0.0.1` (both serve, but only `localhost` passes auth).
- Never sign out the verify session except when testing sign-out; restore with `auth` afterwards.
- After `auth`, the new cookie applies to flows only (each flow relaunches the profile); doctor confirms it took effect.
