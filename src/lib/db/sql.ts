import "server-only";

import { PgClient } from "@effect/sql-pg";
import { Effect, Layer, ManagedRuntime, Redacted } from "effect";
import { SqlClient, SqlError } from "effect/sql";
import { env } from "@/env";
import { DatabaseError } from "@/lib/db/database";

function createSqlRuntime() {
	return ManagedRuntime.make(PgClient.layer({ url: Redacted.make(env.DATABASE_URL) }));
}

export type SqlRuntime = ReturnType<typeof createSqlRuntime>;

// The runtime owns the pool for the server process, including across dev hot reloads.
const runtime = (globalThis.horusSqlRuntime ??= createSqlRuntime());

export const sqlClient = Layer.effectContext(
	runtime.contextEffect.pipe(Effect.mapError((cause) => new DatabaseError({ cause }))),
);

export const withTransaction = <A, E, R>(workflow: Effect.Effect<A, E, R>) =>
	Effect.flatMap(SqlClient.SqlClient, (sql) => sql.withTransaction(workflow)).pipe(
		Effect.mapError((cause) => (SqlError.isSqlError(cause) ? new DatabaseError({ cause }) : cause)),
	);
