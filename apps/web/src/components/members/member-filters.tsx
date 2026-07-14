"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MembershipPlan, QuotaStatus } from "@/lib/types";

export type MemberStatusFilter = "" | "ACTIVE" | "INACTIVE";
export type MemberPlanFilter = "" | "none" | string;

const QUOTA_FILTERS: { value: QuotaStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "up_to_date", label: "Em dia" },
  { value: "due_soon", label: "A vencer" },
  { value: "overdue", label: "Em atraso" },
  { value: "no_plan", label: "Sem plano" },
  { value: "pending", label: "Pendente" },
];

const STATUS_FILTERS: { value: MemberStatusFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "INACTIVE", label: "Inactivos" },
];

interface MemberFiltersProps {
  quotaStatus: QuotaStatus | "";
  memberStatus: MemberStatusFilter;
  planId: MemberPlanFilter;
  plans: MembershipPlan[] | undefined;
  onQuotaStatusChange: (value: QuotaStatus | "") => void;
  onMemberStatusChange: (value: MemberStatusFilter) => void;
  onPlanIdChange: (value: MemberPlanFilter) => void;
  onClear: () => void;
}

export function MemberFilters({
  quotaStatus,
  memberStatus,
  planId,
  plans,
  onQuotaStatusChange,
  onMemberStatusChange,
  onPlanIdChange,
  onClear,
}: MemberFiltersProps) {
  const hasActiveFilters = Boolean(quotaStatus || memberStatus || planId);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Quota:
        </span>
        {QUOTA_FILTERS.map((f) => (
          <FilterChip
            key={f.value || "all-quota"}
            active={quotaStatus === f.value}
            onClick={() => onQuotaStatusChange(f.value)}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Estado:
        </span>
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.value || "all-status"}
            active={memberStatus === f.value}
            onClick={() => onMemberStatusChange(f.value)}
          >
            {f.label}
          </FilterChip>
        ))}

        <span className="ml-2 text-sm font-medium text-muted-foreground">
          Plano:
        </span>
        <select
          value={planId}
          onChange={(e) => onPlanIdChange(e.target.value as MemberPlanFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos os planos</option>
          <option value="none">Sem plano</option>
          {(plans ?? [])
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
