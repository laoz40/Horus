import { readFileSync } from "node:fs";
import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";

export default Effect.gen(function* () {
	const sql = yield* SqlClient.SqlClient;

	const tables = [
		"account",
		"exercise_muscle_groups",
		"exercises",
		"muscle_groups",
		"session",
		"user",
		"verification",
		"workout_exercises",
		"workout_sets",
		"workouts",
	];

	const existing = yield* sql<{ table_name: string }>`
		SELECT table_name FROM information_schema.tables
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
		AND ${sql.in("table_name", tables)}
	`;

	// Production and copied Neon branches already have the initial schema.
	if (existing.length === tables.length) {
		yield* Effect.logInfo("Recorded the existing database as the initial migration.");

		return;
	}

	if (existing.length > 0) {
		return yield* new Migrator.MigrationError({
			kind: "BadState",
			message: "Initial schema is incomplete. Refusing to baseline or overwrite existing tables.",
		});
	}

	const schema = readFileSync(new URL("./001_initial.sql", import.meta.url), "utf8");
	yield* sql.unsafe(schema);
});
