import fs from "node:fs";
import path from "node:path";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { z } from "zod";

// Dedicated E2E user: every row a test creates belongs to this account, and global
// setup/teardown wipes its workouts so runs start and end clean.
export const E2E_USER_ID = "e2e-agent";
export const E2E_EMAIL = "e2e-agent@horus.local";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

// Parse .env.local directly instead of importing @/env — that module is wired for Next
// and validates vars the tests don't need (OAuth, Resend, ...).
const envFileVars = new Map<string, string>();
for (const line of fs.readFileSync(path.join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
	const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
	if (match?.[1] && match[2]) envFileVars.set(match[1], match[2].trim());
}

// Throws on missing vars so a stale .env.local fails fast with a clear message.
export function envVar(name: string): string {
	const value = envFileVars.get(name);
	if (value === undefined) throw new Error(`Missing ${name} in .env.local`);
	return value;
}

let client: NeonQueryFunction<false, false> | undefined;

const RETRY_DELAYS_MS = [500, 1000];

async function withRetry<TRow>(run: () => Promise<TRow[]>, attempt = 0): Promise<TRow[]> {
	try {
		return await run();
	} catch (error) {
		if (attempt >= RETRY_DELAYS_MS.length) throw error;
		await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
		return withRetry(run, attempt + 1);
	}
}

// Row schema for write queries, which return no rows.
const noRows = z.object({});

// Tagged-template SQL runner: `sql(rowSchema)\`SELECT ...\`` parses every returned row
// with the given schema (boundary validation). Built-in retries cover the neon HTTP
// driver's intermittent connection drops while the dev server and tests share Neon.
export function sql<TRow>(rowSchema: z.ZodType<TRow>) {
	return (strings: TemplateStringsArray, ...values: unknown[]): Promise<TRow[]> =>
		withRetry(async () => {
			const db = (client ??= neon(envVar("DATABASE_URL")));
			const rows = await db(strings, ...values);
			return rows.map((row) => rowSchema.parse(row));
		});
}

// FKs cascade to workout_exercises and workout_sets.
export async function deleteE2EWorkouts() {
	await sql(noRows)`DELETE FROM workouts WHERE user_id = ${E2E_USER_ID}`;
}

// Wipe the e2e user's leftover sessions (a new one is minted right after in global setup).
export async function deleteE2ESessions() {
	await sql(noRows)`DELETE FROM "session" WHERE user_id = ${E2E_USER_ID}`;
}
