import { PrismaClient } from '@prisma/client';

// Declare a global variable to store the PrismaClient instance
// This prevents creating multiple instances in development, which is important for Next.js
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'development') {
  global.prisma = prisma;
}

export { prisma };
