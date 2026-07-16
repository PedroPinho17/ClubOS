import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Numerário",
  TRANSFER: "Transferência",
  CARD: "Cartão",
  MBWAY: "MB WAY",
  OTHER: "Outro",
};

export const STATUS_BADGE: Record<
  PaymentStatus,
  { label: string; variant: "success" | "muted" | "secondary" | "default" }
> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "muted" },
  REFUNDED: { label: "Reembolsado", variant: "default" },
};
