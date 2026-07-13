import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";

export const db = drizzle({
	client: neon(env.DATABASE_URL),
	schema,
});
