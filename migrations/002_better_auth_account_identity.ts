import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";

export default Effect.gen(function* () {
	const sql = yield* SqlClient.SqlClient;

	const duplicates = yield* sql`
		SELECT provider_id, account_id FROM account
		GROUP BY provider_id, account_id
		HAVING count(*) > 1
		LIMIT 1
	`;

	if (duplicates.length > 0) {
		return yield* new Migrator.MigrationError({
			kind: "BadState",
			message: "Duplicate provider/account keys must be resolved before upgrading Better Auth.",
		});
	}

	// Better Auth 1.7.3+ no longer writes issuer. Retain the column for existing data.
	yield* sql`ALTER TABLE account ALTER COLUMN issuer DROP NOT NULL`;
	yield* sql`DROP INDEX account_issuer_account_unique`;
});
