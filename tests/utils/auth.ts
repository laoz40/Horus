import crypto from "node:crypto";

import { z } from "zod";

import { E2E_EMAIL, E2E_USER_ID, envVar, sql } from "./db";

// Write queries return no rows.
const noRows = z.object({});

// better-auth signs the session cookie value as `token.base64(hmacSHA256(token, secret))` —
// standard padded base64, NOT base64url.
function signedCookieValue(token: string, secret: string): string {
	const sig = crypto.createHmac("sha256", secret).update(token).digest("base64");
	return `${token}.${sig}`;
}

// Insert the e2e user (if missing) plus a fresh session row, and return Playwright
// storageState JSON carrying the signed session cookie. This skips the real email OTP
// round-trip for tests that don't specifically exercise the login page.
export async function mintStorageState(): Promise<string> {
	const token = crypto.randomBytes(32).toString("hex");

	await sql(noRows)`
		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
		VALUES (${E2E_USER_ID}, 'E2E Agent', ${E2E_EMAIL}, true, now(), now())
		ON CONFLICT (id) DO UPDATE SET updated_at = now()`;
	await sql(noRows)`
		INSERT INTO "session" (id, token, expires_at, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES (${crypto.randomUUID()}, ${token}, now() + interval '7 days', now(), now(), null,
		        'horus-e2e', ${E2E_USER_ID})`;

	const storageState = {
		cookies: [
			{
				name: "better-auth.session_token",
				value: signedCookieValue(token, envVar("BETTER_AUTH_SECRET")),
				domain: "localhost",
				path: "/",
				httpOnly: true,
				secure: false,
				sameSite: "Lax",
				expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
			},
		],
		origins: [],
	};
	return JSON.stringify(storageState, null, "\t");
}

const upstashGetResponse = z.object({ result: z.string().nullable() });
const otpVerification = z.object({ value: z.string() });

// better-auth's emailOTP plugin (with secondaryStorage) stores the code in Redis under
// `verification:sign-in-otp-<email>` as JSON `{ value: "<otp>:0", ... }`.
export async function readSignInOtp(email: string): Promise<string> {
	const key = encodeURIComponent(`verification:sign-in-otp-${email}`);
	const response = await fetch(`${envVar("UPSTASH_REDIS_REST_URL")}/get/${key}`, {
		headers: { Authorization: `Bearer ${envVar("UPSTASH_REDIS_REST_TOKEN")}` },
	});
	const { result } = upstashGetResponse.parse(await response.json());
	if (result === null) throw new Error(`No OTP found in Redis for ${email}`);
	const [otp] = otpVerification.parse(JSON.parse(result)).value.split(":");
	if (otp === undefined) throw new Error(`Malformed OTP stored for ${email}`);
	return otp;
}
