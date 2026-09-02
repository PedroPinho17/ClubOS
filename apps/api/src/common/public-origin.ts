import { hostnameAliases, normalizeHostname } from "./host-hostname";

/** Primeira origem da plataforma (demo / fallback de emails e QR). */
export function platformOrigin(): string {
  return (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]
    .trim();
}

/**
 * Origem publica do clube: `https://{domain}` se o tenant tiver dominio,
 * senao a origem da plataforma.
 */
export function publicOriginForOrg(org: { domain?: string | null }): string {
  if (org.domain) {
    const host = normalizeHostname(org.domain);
    if (host) return `https://${host}`;
  }
  return platformOrigin();
}

/** Origens HTTPS (e HTTP em localhost) para um hostname e o par www/apex. */
export function originsFromHostname(host: string): string[] {
  const origins: string[] = [];
  for (const h of hostnameAliases(host)) {
    if (h === "localhost" || h === "127.0.0.1") {
      origins.push(`http://${h}:3000`, `http://${h}`);
    } else {
      origins.push(`https://${h}`);
    }
  }
  return [...new Set(origins)];
}

export function replaceUrlOrigin(url: string, origin: string): string {
  try {
    const parsed = new URL(url);
    return new URL(
      parsed.pathname + parsed.search + parsed.hash,
      origin,
    ).toString();
  } catch {
    return url;
  }
}
