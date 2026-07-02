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
  const res = await fetch(`${API_URL}/api${path}`, { credentials: 'include' });
  if (!res.ok) {
    throw new ApiError(res.status, 'Falha ao obter o ficheiro.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Upload multipart (ex.: foto/logotipo). Nao define Content-Type (o browser trata). */
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    body: form,
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
  return res.json() as Promise<T>;
}

/** Descarrega CSV autenticado (relatórios). */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}/api${path}`, { credentials: 'include' });
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
