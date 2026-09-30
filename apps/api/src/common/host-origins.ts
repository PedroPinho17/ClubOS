import { prisma } from "@clubos/database";
import { originsFromHostname } from "./public-origin";

const TTL_MS = 30_000;

let cache: string[] = [];
let fetchedAt = 0;

export function staticWebOrigins(): string[] {
  return (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function invalidateOrgOriginsCache(): void {
  fetchedAt = 0;
}

async function loadOrgOrigins(): Promise<string[]> {
  const rows = await prisma.organization.findMany({
    where: { domain: { not: null } },
    select: { domain: true },
  });
  return rows.flatMap((r) => (r.domain ? originsFromHostname(r.domain) : []));
}

export async function getTrustedOrigins(): Promise<string[]> {
  if (Date.now() - fetchedAt > TTL_MS) {
    try {
      cache = await loadOrgOrigins();
      fetchedAt = Date.now();
    } catch {
      // mantem cache anterior se a BD falhar
    }
  }
  const origins = [...staticWebOrigins(), ...cache, "clubos://"];
  if (process.env.NODE_ENV !== "production") {
    origins.push("exp://");
  }
  return [...new Set(origins)];
}

export async function isTrustedOrigin(origin: string): Promise<boolean> {
  const allowed = await getTrustedOrigins();
  return allowed.includes(origin);
}

/** Callback CORS: origens estaticas + Organization.domain (cache 30s). */
export function corsOriginDelegate() {
  return async (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    try {
      cb(null, await isTrustedOrigin(origin));
    } catch (err) {
      cb(err as Error, false);
    }
  };
}
