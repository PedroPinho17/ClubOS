import { prisma } from '@clubos/database';

/** Verifica se Postgres esta acessivel (testes E2E saltam se nao). */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
