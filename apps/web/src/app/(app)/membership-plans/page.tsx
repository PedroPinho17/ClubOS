"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMembershipPlansMutations } from "@/hooks/use-membership-plans-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import type { MembershipPlan, Periodicity } from "@/lib/types";

const PERIODICITY_LABEL: Record<Periodicity, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  BIANNUAL: "Semestral",
  ANNUAL: "Anual",
  ONCE: "Única",
};

export default function MembershipPlansPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <MembershipPlansPageContent />
    </RoleGate>
  );
}

function MembershipPlansPageContent() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [periodicity, setPeriodicity] = useState<Periodicity>("MONTHLY");
  const [planToRemove, setPlanToRemove] = useState<MembershipPlan | null>(null);

  const plansKey = useTenantQueryKey(["membership-plans"]);
  const { createPlan, toggleActive, removePlan } =
    useMembershipPlansMutations();

  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Planos de Quota</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Define os planos, valores e periodicidade das quotas dos sócios.
      </p>

      <Card id="create-plan-form" className="mb-6">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || Number(amount) <= 0) return;
              createPlan.mutate(
                { name, amount, periodicity },
                {
                  onSuccess: () => {
                    setName("");
                    setAmount("");
                    setPeriodicity("MONTHLY");
                  },
                },
              );
            }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="plan-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quota Mensal"
              />
            </div>
            <div className="w-full space-y-1 sm:w-32">
              <label htmlFor="plan-amount" className="text-sm font-medium">
                Valor (€)
              </label>
              <Input
                id="plan-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
              />
            </div>
            <div className="w-full space-y-1 sm:w-40">
              <label htmlFor="plan-periodicity" className="text-sm font-medium">
                Periodicidade
              </label>
              <select
                id="plan-periodicity"
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value as Periodicity)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(PERIODICITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="min-h-11 w-full sm:w-auto"
              disabled={
                createPlan.isPending || !name.trim() || Number(amount) <= 0
              }
            >
              {createPlan.isPending ? "A criar..." : "Adicionar plano"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError ? (
        <QueryErrorCard onRetry={() => void refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {!isLoading && plans && plans.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Sem planos de quota"
                description="Crie o primeiro plano para começar a atribuir quotas aos sócios."
                actions={[
                  {
                    label: "Criar plano",
                    onClick: () =>
                      document
                        .getElementById("create-plan-form")
                        ?.scrollIntoView({ behavior: "smooth" }),
                  },
                ]}
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Nome</th>
                        <th className="p-3 font-medium">Valor</th>
                        <th className="p-3 font-medium">Periodicidade</th>
                        <th className="p-3 font-medium">Sócios</th>
                        <th className="p-3 font-medium">Estado</th>
                        <th className="p-3 font-medium text-right">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <TableBodySkeleton rows={4} cols={6} />
                      ) : plans && plans.length > 0 ? (
                        plans.map((p) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3">
                              {Number(p.amount).toFixed(2)} €
                            </td>
                            <td className="p-3">
                              {PERIODICITY_LABEL[p.periodicity]}
                            </td>
                            <td className="p-3">{p._count?.members ?? 0}</td>
                            <td className="p-3">
                              <Badge variant={p.active ? "success" : "muted"}>
                                {p.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-end">
                                <PlanRowActions
                                  plan={p}
                                  togglePending={toggleActive.isPending}
                                  removePending={removePlan.isPending}
                                  onToggle={() => toggleActive.mutate(p)}
                                  onRemove={() => setPlanToRemove(p)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 sm:hidden">
                  {isLoading ? (
                    <MobileCardsSkeleton count={3} />
                  ) : plans && plans.length > 0 ? (
                    plans.map((p) => (
                      <div key={p.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold">{p.name}</p>
                            <p className="mt-1 text-sm font-medium">
                              {Number(p.amount).toFixed(2)} €
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {PERIODICITY_LABEL[p.periodicity]} ·{" "}
                              {p._count?.members ?? 0} sócios
                            </p>
                          </div>
                          <Badge variant={p.active ? "success" : "muted"}>
                            {p.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <PlanRowActions
                            plan={p}
                            togglePending={toggleActive.isPending}
                            removePending={removePlan.isPending}
                            onToggle={() => toggleActive.mutate(p)}
                            onRemove={() => setPlanToRemove(p)}
                            fullWidth
                          />
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={planToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPlanToRemove(null);
        }}
        title="Remover plano?"
        description={
          planToRemove ? `Remover o plano "${planToRemove.name}"?` : ""
        }
        confirmLabel="Remover"
        variant="destructive"
        loading={removePlan.isPending}
        onConfirm={() => {
          if (planToRemove) {
            removePlan.mutate(planToRemove.id, {
              onSuccess: () => setPlanToRemove(null),
            });
          }
        }}
      />
    </div>
  );
}

function PlanRowActions({
  plan,
  togglePending,
  removePending,
  onToggle,
  onRemove,
  fullWidth,
}: {
  plan: MembershipPlan;
  togglePending: boolean;
  removePending: boolean;
  onToggle: () => void;
  onRemove: () => void;
  fullWidth?: boolean;
}) {
  return (
    <DropdownMenu
      align="end"
      className={fullWidth ? "w-full [&>div:first-child]:w-full" : undefined}
      trigger={
        <Button
          variant="outline"
          size="sm"
          className={fullWidth ? "min-h-11 w-full" : "min-h-11"}
          aria-label={`Acções do plano ${plan.name}`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
          Acções
        </Button>
      }
    >
      <DropdownMenuLabel>{plan.name}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={togglePending} onClick={onToggle}>
        {plan.active ? "Desativar" : "Ativar"}
      </DropdownMenuItem>
      <DropdownMenuItem destructive disabled={removePending} onClick={onRemove}>
        Remover
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
