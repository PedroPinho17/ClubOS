import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

// Carrega o .env do monorepo antes de qualquer import que leia process.env
// (Better Auth e Prisma leem no momento do import).
const candidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", "..", ".env"),
];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

const DEV_PLACEHOLDER_SECRET = "dev-secret-change-me";

/**
 * Em producao exige BETTER_AUTH_SECRET forte. Em dev/test permite placeholder.
 */
export function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret || secret === DEV_PLACEHOLDER_SECRET || secret.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET obrigatorio em producao (min. 32 caracteres; nao usar o default de desenvolvimento).",
      );
    }
    return secret;
  }

  return secret && secret.length > 0 ? secret : DEV_PLACEHOLDER_SECRET;
}

export function resolveQrSigningSecret(): string {
  const explicit = process.env.QR_SIGNING_SECRET?.trim();
  if (explicit) return explicit;

  const authSecret = process.env.BETTER_AUTH_SECRET?.trim();
  if (authSecret && authSecret !== DEV_PLACEHOLDER_SECRET) return authSecret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "QR_SIGNING_SECRET ou BETTER_AUTH_SECRET obrigatorio em producao para assinar QR.",
    );
  }

  return DEV_PLACEHOLDER_SECRET;
}

// Valida cedo (antes do Better Auth / Nest boot) quando NODE_ENV=production.
if (process.env.NODE_ENV === "production") {
  resolveAuthSecret();
}
