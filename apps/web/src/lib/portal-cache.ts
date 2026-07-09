const PORTAL_CACHE_KEY = "clubos:portal:me:v2";

export function readPortalCache<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PORTAL_CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writePortalCache<T>(data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — ignorar
  }
}

export function clearPortalCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PORTAL_CACHE_KEY);
}
