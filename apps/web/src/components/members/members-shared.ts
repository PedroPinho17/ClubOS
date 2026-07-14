import { formatDateInput, todayDateInput } from "@/lib/date-input";
import type { Member, QuotaStatus } from "@/lib/types";
import type { MemberEditForm } from "./member-edit-dialog";

export const PAGE_SIZE = 25;

export const QUOTA_BADGE: Record<
  QuotaStatus,
  {
    label: string;
    variant: "success" | "muted" | "secondary" | "default" | "warning";
  }
> = {
  up_to_date: { label: "Em dia", variant: "success" },
  due_soon: { label: "A vencer", variant: "warning" },
  overdue: { label: "Em atraso", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  no_plan: { label: "Sem plano", variant: "muted" },
};

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function emptyEditForm(): MemberEditForm {
  return {
    name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    quotaPlanId: "",
    cardRole: "",
    notes: "",
    joinedAt: todayDateInput(),
    cardValidUntil: "",
  };
}

export function memberToForm(m: Member): MemberEditForm {
  return {
    name: m.name,
    email: m.email ?? "",
    phone: m.phone ?? "",
    status: m.status,
    quotaPlanId: m.quotaPlan?.id ?? "",
    cardRole: m.cardRole ?? "",
    notes: m.notes ?? "",
    joinedAt: m.joinedAt ? formatDateInput(m.joinedAt) : todayDateInput(),
    cardValidUntil: m.cardValidUntil ? formatDateInput(m.cardValidUntil) : "",
  };
}

export function isGdprErased(m: Member): boolean {
  return m.name === "Apagado RGPD";
}

export function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
