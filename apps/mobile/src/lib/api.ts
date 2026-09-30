import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_VERSION, getApiBaseUrl } from "./config";
import { authClient } from "./auth-client";

const ORG_KEY = "clubos.activeOrganizationId";

export async function getActiveOrganizationId(): Promise<string | null> {
  return AsyncStorage.getItem(ORG_KEY);
}

export async function setActiveOrganizationId(id: string | null) {
  if (id) await AsyncStorage.setItem(ORG_KEY, id);
  else await AsyncStorage.removeItem(ORG_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  organizationId?: string | null;
  raw?: boolean;
};

/**
 * Cliente fetch para a API ClubOS.
 * Cookie Better Auth via authClient.getCookie(); credentials omit (nativo).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}/api${path.startsWith("/") ? path : `/${path}`}`;
  const cookie = (await authClient.getCookie()) ?? "";
  const orgId =
    options.organizationId !== undefined
      ? options.organizationId
      : await getActiveOrganizationId();

  const headers: Record<string, string> = {
    "x-app-version": APP_VERSION,
    Accept: "application/json",
  };
  if (cookie) headers.Cookie = cookie;
  if (orgId) headers["x-organization-id"] = orgId;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "omit",
  });

  if (options.raw) {
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(res.status, text || res.statusText);
    }
    return res as unknown as T;
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message.join(", ");
      else if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as T;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const res = await apiFetch<Response>(path, { raw: true });
  return res.blob();
}
