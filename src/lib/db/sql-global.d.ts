import type { SqlRuntime } from "@/lib/db/sql";

declare global {
	var horusSqlRuntime: SqlRuntime | undefined;
}
