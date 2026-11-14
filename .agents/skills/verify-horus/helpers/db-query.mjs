#!/usr/bin/env node
// Read-only-ish SQL probe against the dev Neon database, for verifying side effects
// (e.g. a workout row appearing after saving a workout in the UI) and for cleanup deletes.
// Uses the app's own @neondatabase/serverless dependency and DATABASE_URL from .env.local.
//
// Usage:
//   node db-query.mjs --sql "SELECT w.id, w.name FROM workouts w ..."
//   node db-query.mjs --sql "DELETE FROM workouts WHERE user_id = 'verify-agent'"
//     --yes   required for anything that is not a SELECT
//   node db-query.mjs --session-preflight
//     Check DATABASE_URL_UNPOOLED before experiments use session-local temp tables.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const args = process.argv.slice(2);
const sqlText = args.includes("--sql") ? args[args.indexOf("--sql") + 1] : undefined;
const sessionPreflight = args.includes("--session-preflight");
if (!sqlText && !sessionPreflight) {
	console.error('Usage: db-query.mjs --sql "<query>" [--yes] | --session-preflight');
	process.exit(1);
}

const isMutation = sqlText && !/^\s*select/i.test(sqlText);
if (isMutation && !args.includes("--yes")) {
	console.error("Refusing to run a non-SELECT without --yes.");
	process.exit(1);
}

const envVars = {};
for (const line of fs.readFileSync(path.join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
	const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
	if (match) envVars[match[1]] = match[2].trim();
}
if (sessionPreflight) {
	const connectionString = envVars.DATABASE_URL_UNPOOLED;
	if (!connectionString) {
		console.error(
			"Set DATABASE_URL_UNPOOLED in .env.local to the direct Neon connection URL. Session-local temporary tables must not use pooled DATABASE_URL.",
		);
		process.exit(1);
	}

	try {
		const url = new URL(connectionString);
		if (url.hostname.includes("-pooler.")) {
			console.error(
				"DATABASE_URL_UNPOOLED points to a Neon pooler. Copy the direct connection URL with pooling disabled from Neon into .env.local, then rerun --session-preflight.",
			);
			process.exit(1);
		}
		const mod = await import(createRequire(path.join(REPO_ROOT, "package.json")).resolve("pg"));
		const Client = mod.Client ?? mod.default.Client;
		const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 });
		try {
			await client.connect();
			await client.query(
				"CREATE TEMP TABLE horus_session_preflight AS SELECT pg_backend_pid() AS pid",
			);
			const result = await client.query(
				"SELECT pid = pg_backend_pid() AS same_session FROM horus_session_preflight",
			);
			if (result.rows[0]?.same_session !== true) throw new Error("Session changed");
		} finally {
			// Closing this connection also drops its temporary table.
			await client.end();
		}
		console.log(
			"Session preflight passed. Use DATABASE_URL_UNPOOLED and one connected pg.Client for all session-local temporary-table statements. Do not use the Neon HTTP query client or separate pooled queries.",
		);
	} catch {
		// Driver errors can include connection details. Never print them here.
		console.error(
			"Session preflight failed. Check DATABASE_URL_UNPOOLED, database access and TLS settings, then rerun --session-preflight. Use the direct Neon URL and one connected pg.Client for all temporary-table statements.",
		);
		process.exit(1);
	}
} else {
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
}
