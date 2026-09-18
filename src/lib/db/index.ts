import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/env";

function createPrisma() {
	const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

	return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
	globalThis.horusPrisma ??= createPrisma();

	return globalThis.horusPrisma;
}

export const prisma = getPrismaClient();

export type DatabaseTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function runDatabaseTransaction<T>(
	transaction: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
	return prisma.$transaction(transaction);
}
