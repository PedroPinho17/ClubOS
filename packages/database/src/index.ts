/**
 * @module Database
 * Cliente Prisma partilhado (`@clubos/database`).
 * Re-exporta todos os tipos gerados a partir de `schema.prisma`.
 *
 * @see {@link ../docs/BASE-DE-DADOS.md} Modelos e relacoes
 */
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
