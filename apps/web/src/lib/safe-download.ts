import {
  ApiError,
  downloadBlob,
  downloadCsv,
  downloadJson,
  openBlob,
} from "@/lib/api";
import { toast } from "@/lib/toast";

export function downloadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "Sem permissão para esta acção.";
    if (err.status === 401) return "Sessão expirada. Entre novamente.";
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Não foi possível concluir o download.";
}

async function withDownloadFeedback(
  action: () => Promise<void>,
  successMessage?: string,
): Promise<void> {
  try {
    await action();
    if (successMessage) toast.success(successMessage);
  } catch (err) {
    toast.error(downloadErrorMessage(err));
  }
}

export function safeOpenBlob(path: string): Promise<void> {
  return withDownloadFeedback(() => openBlob(path));
}

export function safeDownloadCsv(path: string, filename: string): Promise<void> {
  return withDownloadFeedback(
    () => downloadCsv(path, filename),
    "Download iniciado",
  );
}

export function safeDownloadJson(
  path: string,
  filename: string,
): Promise<void> {
  return withDownloadFeedback(
    () => downloadJson(path, filename),
    "Exportação iniciada",
  );
}

export function safeDownloadBlob(
  path: string,
  filename: string,
): Promise<void> {
  return withDownloadFeedback(
    () => downloadBlob(path, filename),
    "Download iniciado",
  );
}
