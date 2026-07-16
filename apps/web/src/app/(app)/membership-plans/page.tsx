"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { TableBodySkeleton } from "@/components/page-skeletons";
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
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quota Mensal"
              />
            </div>
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Valor (€)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium">Periodicidade</label>
              <select
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
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Periodicidade</th>
                    <th className="p-3 font-medium">Sócios</th>
                    <th className="p-3 font-medium">Estado</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableBodySkeleton rows={4} cols={6} />
                  ) : plans && plans.length > 0 ? (
                    plans.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">{Number(p.amount).toFixed(2)} €</td>
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={toggleActive.isPending}
                              onClick={() => toggleActive.mutate(p)}
                            >
                              {p.active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={removePlan.isPending}
                              onClick={() => setPlanToRemove(p)}
                            >
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
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
