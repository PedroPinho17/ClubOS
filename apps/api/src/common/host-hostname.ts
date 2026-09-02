/**
 * Normalizacao e classificacao de hostnames (dominio custom por clube).
 */

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export const HOST_ORG_MISMATCH_MESSAGE =
  "Esta conta nao pertence a este clube.";

function headerFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Lowercase, sem protocolo/path/porta. */
export function normalizeHostname(raw: string): string {
  let value = raw.trim().toLowerCase();
  if (!value) return "";

  if (value.includes("://")) {
    try {
      value = new URL(value).host;
    } catch {
      value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
    }
  }

  value = (value.split("/")[0] ?? "").replace(/\.$/, "");

  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end >= 0 ? value.slice(0, end + 1) : value;
  }

  return value.replace(/:\d+$/, "");
}

/** Host exacto + variante www / apex. */
export function hostnameAliases(host: string): string[] {
  const n = normalizeHostname(host);
  if (!n) return [];
  if (n.startsWith("www.")) return [n, n.slice(4)];
  if (n.includes(".")) return [n, `www.${n}`];
  return [n];
}

export function hostnameLookupCandidates(host: string): string[] {
  return hostnameAliases(host);
}

export function parsePlatformHosts(
  envValue: string | undefined = process.env.PLATFORM_HOSTS,
): Set<string> {
  const extra = (envValue ?? "")
    .split(",")
    .map((s) => normalizeHostname(s))
    .filter(Boolean);
  return new Set(["localhost", "127.0.0.1", ...extra]);
}

export function isPlatformHost(
  host: string,
  platform: Set<string> = parsePlatformHosts(),
): boolean {
  return hostnameAliases(host).some((alias) => platform.has(alias));
}

export function isValidClubHostname(
  host: string,
  platform: Set<string> = parsePlatformHosts(),
): boolean {
  const n = normalizeHostname(host);
  if (!n || isPlatformHost(n, platform)) return false;
  return HOSTNAME_RE.test(n);
}

export function parseRequestHost(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const forwarded = headerFirst(headers["x-forwarded-host"]);
  const host = headerFirst(headers.host);
  const raw = forwarded ?? host;
  if (!raw) return null;
  const first = raw.split(",")[0] ?? "";
  return normalizeHostname(first) || null;
}
