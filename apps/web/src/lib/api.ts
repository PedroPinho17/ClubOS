/**
 * @module ApiClient
 * Cliente HTTP para a API NestJS. Envia cookies de sessao e header de org activa.
 *
 * @see {@link ../../../docs/FRONTEND.md} Documentacao do frontend
 */
import { orgRequestHeaders } from './org-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(orgRequestHeaders())) {
    headers.set(key, value as string);
  }

  // Cookies de sessao do Better Auth (cross-origin em dev).
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Abre um recurso binario (ex.: PDF) numa nova aba, enviando cookies de sessao. */
export async function openBlob(path: string): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    headers: orgRequestHeaders(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, 'Falha ao obter o ficheiro.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Upload multipart (ex.: foto/logotipo, import Excel). */
export async function uploadFile<T>(
  path: string,
  file: File,
  fields?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
  }
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: orgRequestHeaders(),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/** Descarrega ficheiro binario autenticado (ex.: modelo Excel). */
export async function downloadBlob(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    headers: orgRequestHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, 'Falha ao descarregar o ficheiro.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Descarrega JSON autenticado (ex.: export RGPD). */
export async function downloadJson(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    headers: orgRequestHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, 'Falha ao descarregar o ficheiro.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Descarrega CSV autenticado (relatórios). */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include',
    headers: orgRequestHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, 'Falha ao descarregar o ficheiro.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
