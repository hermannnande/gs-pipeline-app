import { PrismaClient } from '@prisma/client';

// Prisma en environnement serverless (Vercel) :
// - réutiliser le même client entre invocations quand c'est possible
// - éviter l'explosion de connexions
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.__prisma = prisma;

