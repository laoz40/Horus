import { config } from "dotenv";
import { PgClient } from "@effect/sql-pg";
import { Effect, Redacted } from "effect";
import { Migrator } from "effect/sql";
import { z } from "zod";
import initial from "../../migrations/001_initial";

config({ path: ".env.local", quiet: true });

// Migrations use a direct connection; CI can supply either Neon URL.
const directUrl = new URL(
	z.url().parse(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL),
);

directUrl.hostname = directUrl.hostname.replace("-pooler", "");

const migrate = Migrator.make({})({
	loader: Migrator.fromRecord({ "001_initial": initial }),
}).pipe(
	Effect.tap((applied) =>
		Effect.logInfo(applied.length === 0 ? "Database is up to date." : "Applied migrations.", {
			migrations: applied,
		}),
	),
	Effect.provide(PgClient.layer({ url: Redacted.make(directUrl.toString()) })),
);

await Effect.runPromise(migrate);
