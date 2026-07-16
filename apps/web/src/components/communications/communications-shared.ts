import type { CommunicationAudience, CommunicationStatus } from "@/lib/types";

export const AUDIENCE_LABEL: Record<CommunicationAudience, string> = {
  ALL: "Todos",
  ACTIVE: "Sócios ativos",
  OVERDUE: "Quotas em atraso",
  PLAN: "Por plano",
};

export const STATUS_BADGE: Record<
  CommunicationStatus,
  { label: string; variant: "success" | "secondary" | "muted" | "default" }
> = {
  QUEUED: { label: "Na fila", variant: "secondary" },
  SENDING: { label: "A enviar", variant: "secondary" },
  SENT: { label: "Enviado", variant: "success" },
  FAILED: { label: "Falhou", variant: "default" },
};

export type Channel = "email" | "whatsapp";

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
