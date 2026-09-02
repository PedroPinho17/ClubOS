"use client";

import { X } from "lucide-react";
import { MemberPhoto } from "@/components/members/member-photo";
import { QUOTA_BADGE } from "@/components/members/members-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Member, MembershipPlan, QuotaStatus } from "@/lib/types";

export type PickerQuotaFilter = QuotaStatus | "";
export type PickerPlanFilter = "" | "none" | string;
export type PickerStatusFilter = "" | "ACTIVE" | "INACTIVE";

const QUOTA_FILTERS: { value: PickerQuotaFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "up_to_date", label: "Em dia" },
  { value: "due_soon", label: "A vencer" },
  { value: "overdue", label: "Em atraso" },
  { value: "no_plan", label: "Sem plano" },
  { value: "pending", label: "Pendente" },
];

type PaymentsMemberPickerProps = {
  memberId: string;
  setMemberId: (id: string) => void;
  members: Member[];
  membersLoading: boolean;
  membersHasMore: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  activate: () => void;
  selectedMember: Member | undefined;
  plans: MembershipPlan[] | undefined;
  quotaFilter: PickerQuotaFilter;
  setQuotaFilter: (v: PickerQuotaFilter) => void;
  statusFilter: PickerStatusFilter;
  setStatusFilter: (v: PickerStatusFilter) => void;
  planFilter: PickerPlanFilter;
  setPlanFilter: (v: PickerPlanFilter) => void;
};

export function PaymentsMemberPicker({
  memberId,
  setMemberId,
  members,
  membersLoading,
  membersHasMore,
  searchInput,
  setSearchInput,
  activate,
  selectedMember,
  plans,
  quotaFilter,
  setQuotaFilter,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
}: PaymentsMemberPickerProps) {
  const hasFilters = Boolean(quotaFilter || statusFilter || planFilter);

  const clearFilters = () => {
    setQuotaFilter("");
    setStatusFilter("");
    setPlanFilter("");
  };

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <label className="text-sm font-medium" htmlFor="payment-member-search">
        Sócio
      </label>

      {selectedMember ? (
        <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
          <MemberPhoto
            name={selectedMember.name}
            photoUrl={selectedMember.photoUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {selectedMember.number} — {selectedMember.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selectedMember.quotaPlan?.name ?? "Sem plano"}
              {selectedMember.quotaSituation
                ? ` · ${QUOTA_BADGE[selectedMember.quotaSituation.status].label}`
                : null}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMemberId("")}
            aria-label="Limpar sócio seleccionado"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Input
            id="payment-member-search"
            value={searchInput}
            onChange={(e) => {
              activate();
              setSearchInput(e.target.value);
            }}
            onFocus={activate}
            placeholder="Pesquisar por nome ou número..."
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Quota:
            </span>
            {QUOTA_FILTERS.map((f) => (
              <button
                key={f.value || "all-quota"}
                type="button"
                onClick={() => {
                  activate();
                  setQuotaFilter(f.value);
                }}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition-colors",
                  quotaFilter === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Estado:
            </span>
            {(
              [
                { value: "" as const, label: "Todos" },
                { value: "ACTIVE" as const, label: "Activos" },
                { value: "INACTIVE" as const, label: "Inactivos" },
              ] as const
            ).map((f) => (
              <button
                key={f.value || "all-status"}
                type="button"
                onClick={() => {
                  activate();
                  setStatusFilter(f.value);
                }}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition-colors",
                  statusFilter === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}

            <span className="ml-1 text-xs font-medium text-muted-foreground">
              Plano:
            </span>
            <select
              value={planFilter}
              onFocus={activate}
              onChange={(e) => {
                activate();
                setPlanFilter(e.target.value as PickerPlanFilter);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="none">Sem plano</option>
              {(plans ?? [])
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>

            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </Button>
            ) : null}
          </div>

          <div
            role="listbox"
            aria-label="Lista de sócios"
            className="max-h-56 overflow-y-auto rounded-md border"
            onFocus={activate}
          >
            {membersLoading ? (
              <p className="p-3 text-sm text-muted-foreground">
                A carregar sócios...
              </p>
            ) : members.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Nenhum sócio encontrado com estes filtros.
              </p>
            ) : (
              members.map((m) => {
                const quota = m.quotaSituation
                  ? QUOTA_BADGE[m.quotaSituation.status]
                  : null;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={memberId === m.id}
                    onClick={() => setMemberId(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60",
                      memberId === m.id && "bg-muted",
                    )}
                  >
                    <MemberPhoto
                      name={m.name}
                      photoUrl={m.photoUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.number} — {m.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.quotaPlan?.name ?? "Sem plano"}
                      </p>
                    </div>
                    {quota ? (
                      <Badge variant={quota.variant} className="shrink-0">
                        {quota.label}
                      </Badge>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {membersHasMore ? (
            <p className="text-xs text-muted-foreground">
              Pesquise ou filtre para encontrar mais sócios (50 mostrados).
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
