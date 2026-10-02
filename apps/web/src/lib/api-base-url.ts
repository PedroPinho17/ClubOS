/**
 * Base URL da API no browser.
 * Producao (same-origin): cada dominio do clube faz proxy de `/api` → Nest.
 * Dev: `NEXT_PUBLIC_API_URL` (default http://localhost:4000).
 *
 * Better Auth exige URL absoluto — nunca devolver string vazia (senao vira `/api/auth`).
 */
export function resolveConfiguredApiUrl(): string | "same-origin" {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined) {
    return process.env.NODE_ENV === "production"
      ? "same-origin"
      : "http://localhost:4000";
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "same-origin") return "same-origin";
  return trimmed.replace(/\/$/, "");
}

export function apiBaseUrl(): string {
  const configured = resolveConfiguredApiUrl();
  if (configured === "same-origin") {
    if (typeof window !== "undefined") return window.location.origin;
    // SSR / `next build`: URL absoluto valido. No browser usa-se window.location.origin.
    return "http://127.0.0.1";
  }
  return configured;
}
