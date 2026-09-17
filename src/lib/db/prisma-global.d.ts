import type { PrismaClient } from "@/generated/prisma/client";

declare global {
	var horusPrisma: PrismaClient | undefined;
}
