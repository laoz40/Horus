import "server-only";

import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleTransactionDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";

export const db = drizzle({
	client: neon(env.DATABASE_URL),
	schema,
});

function createTransactionDatabase(pool: Pool) {
	return drizzleTransactionDatabase({ client: pool, schema });
}

export type DatabaseTransaction = Parameters<
	Parameters<ReturnType<typeof createTransactionDatabase>["transaction"]>[0]
>[0];

export async function runDatabaseTransaction<T>(
	transaction: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
	const pool = new Pool({ connectionString: env.DATABASE_URL });
	const transactionDatabase = createTransactionDatabase(pool);

	try {
		return await transactionDatabase.transaction(transaction);
	} finally {
		await pool.end();
	}
}
