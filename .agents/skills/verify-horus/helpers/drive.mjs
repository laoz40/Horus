#!/usr/bin/env node
// Browser harness for verifying Horus (Next.js gym tracker) end to end.
// Drives the real app at http://localhost:8000 with a persistent Chromium profile so the
// verify session cookie survives between invocations. See ../SKILL.md for usage.
//
// Commands:
//   auth                 Mint a session for the verify user (dev DB) and inject its signed cookie into the profile.
//   doctor               App up? Verify session valid? Prints a summary, exits non-zero when the app is down.
//   login                Open a HEADED browser for one-time manual login (e.g. OTP). Blocks until a session exists.
//   flow --out <label> --steps '<json>'
//                        Run a list of driving steps; screenshots/snapshots go to ../evidence/<label>/.
//   session-dump         Print the get-session JSON for the profile cookie (no driving).

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HELPERS_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.dirname(HELPERS_DIR);
const REPO_ROOT = path.resolve(SKILL_DIR, "../../..");
const EVIDENCE_DIR = path.join(SKILL_DIR, "evidence");
const PROFILE_DIR = path.join(process.env.TMPDIR ?? "/tmp", "horus-verify-profile");
const BASE_URL = process.env.HORUS_VERIFY_BASE_URL ?? "http://localhost:8000";
// Must match SITE_URL origin (better-auth validates the Origin header against it).
const SESSION_COOKIE = "better-auth.session_token";
const VERIFY_USER_ID = "verify-agent";
const VERIFY_EMAIL = "verify-agent@horus.local";

function ensurePlaywright() {
	try {
		return awaitImport("playwright-core");
	} catch {
		console.error("Installing playwright-core into helpers (one-time)...");
		spawnSync(
			"npm",
			["install", "--prefix", HELPERS_DIR, "--no-fund", "--no-audit", "playwright-core"],
			{
				stdio: "inherit",
			},
		);
		return awaitImport("playwright-core");
	}
}

function awaitImport(name) {
	const req = createRequire(path.join(HELPERS_DIR, "package.json"));
	return import(req.resolve(name)).then((mod) => {
		// CJS modules expose their exports on `default`
		const exports = mod.chromium ? mod : mod.default;
		return { getChromium: () => exports.chromium };
	});
}

// Parse .env.local for DATABASE_URL / BETTER_AUTH_SECRET without touching the app's env module.
function readEnvLocal() {
	const file = path.join(REPO_ROOT, ".env.local");
	const vars = {};
	if (!fs.existsSync(file)) throw new Error(`${file} not found`);
	for (const line of fs.readFileSync(file, "utf8").split("\n")) {
		const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
		if (match) vars[match[1]] = match[2].trim();
	}
	return vars;
}

async function neonClient() {
	const { DATABASE_URL } = readEnvLocal();
	const mod = await import(
		createRequire(path.join(REPO_ROOT, "package.json")).resolve("@neondatabase/serverless")
	);
	// CJS interop: the named export may sit on `default`
	const neon = mod.neon ?? mod.default.neon;
	return neon(DATABASE_URL);
}

// better-auth always signs the session cookie (better-call signCookieValue): the value is
// `token.base64(hmacSHA256(token, secret))` — standard padded base64, NOT base64url.
function signedCookieValue(token, secret) {
	const sig = crypto.createHmac("sha256", secret).update(token).digest("base64");
	return `${token}.${sig}`;
}

async function mintSession() {
	const envVars = readEnvLocal();
	const sql = await neonClient();
	const token = crypto.randomBytes(32).toString("hex");
	await sql`
		INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
		VALUES (${VERIFY_USER_ID}, 'Verify Agent', ${VERIFY_EMAIL}, true, now(), now())
		ON CONFLICT (id) DO UPDATE SET updated_at = now()`;
	await sql`
		INSERT INTO "session" (id, token, expires_at, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES (${crypto.randomUUID()}, ${token}, now() + interval '7 days', now(), now(), null,
		        'horus-verify', ${VERIFY_USER_ID})`;
	const value = signedCookieValue(token, envVars.BETTER_AUTH_SECRET);
	await injectCookie(value);
	console.log(`Minted session for ${VERIFY_EMAIL} and injected signed cookie into profile.`);
}

async function injectCookie(value) {
	const { getChromium } = await ensurePlaywright();
	const context = await getChromium().launchPersistentContext(PROFILE_DIR, {
		headless: true,
		executablePath: findChromium(),
	});
	await context.addCookies([
		{
			name: SESSION_COOKIE,
			value,
			domain: "localhost",
			path: "/",
			httpOnly: true,
			sameSite: "Lax",
			// Persistent cookie: without `expires` Chromium treats it as a session cookie and
			// never writes it to the profile, so it would vanish between invocations.
			expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
		},
	]);
	await context.close();
}

// Runs inside the app's own page origin, so Origin matches SITE_URL and credentials are sent.
// GET (not POST — the app's session config rejects POST without deferSessionRefresh).
async function fetchSession(page) {
	return page.evaluate(async () => {
		const response = await fetch("/api/auth/get-session", {
			headers: { accept: "application/json" },
		});
		if (response.status === 401) return null;
		return response.json();
	});
}

async function withPersistentContext(headless, fn) {
	const { getChromium } = await ensurePlaywright();
	const context = await getChromium().launchPersistentContext(PROFILE_DIR, {
		headless,
		viewport: { width: 420, height: 900 }, // mobile-first app: drive at phone width
	});
	try {
		const page = context.pages()[0] ?? (await context.newPage());
		return await fn(page, context);
	} finally {
		await context.close();
	}
}

async function doctor() {
	const summary = await withPersistentContext(true, async (page) => {
		const response = await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
		const session = await fetchSession(page);
		return {
			app: response?.ok() ? "up" : `down (status ${response?.status()})`,
			baseUrl: BASE_URL,
			profile: PROFILE_DIR,
			session: session?.user ? `authenticated: ${session.user.email}` : "NOT authenticated",
		};
	});
	for (const [key, value] of Object.entries(summary)) console.log(`${key}: ${value}`);
	if (summary.app !== "up") process.exit(1);
}

async function sessionDump() {
	await withPersistentContext(true, async (page) => {
		await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
		console.log(JSON.stringify(await fetchSession(page), null, 2));
	});
}

async function login() {
	await withPersistentContext(false, async (page, context) => {
		await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
		console.log("Browser window open at /login — complete the OTP or OAuth login manually.");
		console.log(
			"Waiting for an authenticated session (polls every 2s, gives up after 5 minutes)...",
		);
		for (let i = 0; i < 150; i++) {
			await page.waitForTimeout(2000);
			const session = await fetchSession(page);
			if (session?.user) {
				console.log(`Logged in as ${session.user.email}. Session persisted in ${PROFILE_DIR}.`);
				return;
			}
		}
		throw new Error("Timed out waiting for manual login.");
	});
}

// One browser launch per flow; each step is a user action or an evidence capture.
// Steps: goto | click{role?,name,exact?} | fill{placeholder|label|name,value} | press |
//   expectText | expectToast | expectUrl | screenshot | snapshot | text | wait | sessionDump
async function flow({ out, stepsJson }) {
	if (!out) throw new Error("flow requires --out <label>");
	const steps = JSON.parse(stepsJson);
	const outDir = path.join(EVIDENCE_DIR, out);
	fs.mkdirSync(outDir, { recursive: true });

	await withPersistentContext(true, async (page) => {
		for (const [index, step] of steps.entries()) {
			const n = index + 1;
			try {
				await runStep(page, step, outDir, n);
				console.log(`step ${n}: ${describeStep(step)} — ok`);
			} catch (error) {
				const shot = path.join(outDir, `failure-step-${n}.png`);
				await page.screenshot({ path: shot }).catch(() => {});
				throw new Error(
					`step ${n} FAILED (${describeStep(step)}): ${error.message}\nFailure screenshot: ${shot}`,
					{ cause: error },
				);
			}
		}
	});
	console.log(`Evidence: ${outDir}`);
}

async function runStep(page, step, outDir, n) {
	if (step.goto) {
		await page.goto(step.goto.startsWith("http") ? step.goto : new URL(step.goto, BASE_URL).href, {
			waitUntil: "domcontentloaded",
			timeout: 20000,
		});
	} else if (step.click) {
		await page
			.getByRole(step.click.role ?? "button", {
				name: step.click.name,
				exact: step.click.exact ?? false,
			})
			.first()
			.click();
	} else if (step.fill) {
		const locator = step.fill.placeholder
			? page.getByPlaceholder(step.fill.placeholder)
			: step.fill.label
				? page.getByLabel(step.fill.label)
				: page.getByRole("textbox", { name: step.fill.name });
		await locator.first().fill(step.fill.value);
	} else if (step.press) {
		await page.keyboard.press(step.press);
	} else if (step.expectText) {
		await page.getByText(step.expectText, { exact: false }).first().waitFor({ timeout: 10000 });
	} else if (step.expectToast) {
		await page
			.locator(`[data-sonner-toast]:has-text("${step.expectToast}")`)
			.first()
			.waitFor({ timeout: 10000 });
	} else if (step.expectUrl) {
		await page.waitForURL((url) => url.href.includes(step.expectUrl), { timeout: 10000 });
	} else if (step.screenshot) {
		await page.screenshot({ path: path.join(outDir, step.screenshot), fullPage: true });
	} else if (step.snapshot) {
		const snap = await page.locator("body").ariaSnapshot();
		fs.writeFileSync(path.join(outDir, `step-${n}-aria-snapshot.yml`), snap);
	} else if (step.text) {
		console.log(`--- body text (step ${n}) ---`);
		console.log(await page.evaluate(() => document.body.innerText));
	} else if (step.sessionDump) {
		console.log(JSON.stringify(await fetchSession(page), null, 2));
	} else if (step.wait) {
		await page.waitForTimeout(step.wait);
	} else {
		throw new Error(`unknown step: ${JSON.stringify(step)}`);
	}
}

function describeStep(step) {
	const kind = Object.keys(step)[0];
	const detail =
		step.goto ??
		step.press ??
		step.expectText ??
		step.expectToast ??
		step.expectUrl ??
		step.screenshot ??
		"";
	return detail ? `${kind} ${detail}` : kind;
}

const [command, ...args] = process.argv.slice(2);
const flag = (name) => {
	const index = args.indexOf(name);
	return index === -1 ? undefined : args[index + 1];
};

try {
	if (command === "auth") await mintSession();
	else if (command === "doctor") await doctor();
	else if (command === "session-dump") await sessionDump();
	else if (command === "login") await login();
	else if (command === "flow") await flow({ out: flag("--out"), stepsJson: flag("--steps") });
	else
		throw new Error(
			`Unknown command: ${command}. Use auth | doctor | session-dump | login | flow.`,
		);
} catch (error) {
	console.error(`ERROR: ${error.message}`);
	process.exit(1);
}
