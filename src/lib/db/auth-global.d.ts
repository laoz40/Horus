import type { Pool } from "pg";

declare global {
	var horusAuthPool: Pool | undefined;
}
