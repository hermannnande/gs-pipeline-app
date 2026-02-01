import { PrismaClient } from '@prisma/client';

// Prisma en environnement serverless (Vercel) :
// - réutiliser le même client entre invocations quand c'est possible
// - éviter l'explosion de connexions
const globalForPrisma = globalThis;

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

let prismaInstance = globalForPrisma.__prisma;
let initError = globalForPrisma.__prismaInitError || null;

if (!prismaInstance) {
  try {
    prismaInstance = createPrisma();
    globalForPrisma.__prisma = prismaInstance;
  } catch (e) {
    // En cas d'env manquante ou de souci runtime, on évite de faire "crasher" la fonction
    // au chargement du module. Les routes échoueront avec un message clair.
    initError = e instanceof Error ? e : new Error(String(e));
    globalForPrisma.__prismaInitError = initError;
    // Proxy minimal qui lève une erreur descriptive à l'usage
    prismaInstance = new Proxy(
      {},
      {
        get() {
          throw initError;
        },
      }
    );
  }
}

export const prisma = prismaInstance;
export const prismaInitError = initError;

