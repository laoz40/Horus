import "server-only";

import { Context } from "effect";
import type { DatabaseTransaction } from "@/lib/db";

// Database adapters receive either the shared client or the current transaction.
export class DbConnection extends Context.Service<DbConnection, DatabaseTransaction>()(
	"horus/DbConnection",
) {}
