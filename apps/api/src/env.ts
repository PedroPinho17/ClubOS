import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

// Carrega o .env do monorepo antes de qualquer import que leia process.env
// (Better Auth e Prisma leem no momento do import).
const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '..', '.env'),
];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}
