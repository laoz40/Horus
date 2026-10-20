import "server-only";

import { Pool } from "pg";
import { env } from "@/env";

// Reuse the authentication pool across dev hot reloads.
export const authPool = (globalThis.horusAuthPool ??= new Pool({
	connectionString: env.DATABASE_URL,
}));
