import "server-only";

import { Context, Data } from "effect";
import type { PrismaClient } from "@/generated/prisma/client";

export class Database extends Context.Service<
	Database,
	{
		readonly prisma: PrismaClient;
	}
>()("horus/Database") {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
	readonly cause: unknown;
}> {}
