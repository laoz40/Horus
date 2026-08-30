#!/usr/bin/env node
// Read-only-ish SQL probe against the dev Neon database, for verifying side effects
// (e.g. a workout row appearing after saving a workout in the UI) and for cleanup deletes.
// Uses the app's own @neondatabase/serverless dependency and DATABASE_URL from .env.local.
//
// Usage:
//   node db-query.mjs --sql "SELECT w.id, w.name FROM workouts w ..."
//   node db-query.mjs --sql "DELETE FROM workouts WHERE user_id = 'verify-agent'"
//     --yes   required for anything that is not a SELECT

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const args = process.argv.slice(2);
const sqlText = args.includes("--sql") ? args[args.indexOf("--sql") + 1] : undefined;
if (!sqlText) {
	console.error("Usage: db-query.mjs --sql \"<query>\" [--yes]");
	process.exit(1);
}

const isMutation = !/^\s*select/i.test(sqlText);
if (isMutation && !args.includes("--yes")) {
	console.error("Refusing to run a non-SELECT without --yes.");
	process.exit(1);
}

const envVars = {};
for (const line of fs.readFileSync(path.join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
	const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
	if (match) envVars[match[1]] = match[2].trim();
}
if (!envVars.DATABASE_URL) {
	console.error("DATABASE_URL not found in .env.local");
	process.exit(1);
}

const mod = await import(
	createRequire(path.join(REPO_ROOT, "package.json")).resolve("@neondatabase/serverless")
);
const neon = mod.neon ?? mod.default.neon; // CJS interop: named export may sit on `default`
const rows = await neon(envVars.DATABASE_URL).query(sqlText);
console.log(JSON.stringify(rows, null, 2));
