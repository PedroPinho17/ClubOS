"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { RoleGate } from "@/components/role-gate";
import { STAFF_ROLES } from "@/lib/staff-roles";
import { api, openBlob } from "@/lib/api";
import { todayDateInput } from "@/lib/date-input";
import { toast } from "@/lib/toast";
import { useMembersPicker } from "@/hooks/use-members-picker";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type {
  MembershipPlan,
  PaginatedResult,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Numerário",
  TRANSFER: "Transferência",
  CARD: "Cartão",
  MBWAY: "MB WAY",
  OTHER: "Outro",
};

const STATUS_BADGE: Record<
  PaymentStatus,
  { label: string; variant: "success" | "muted" | "secondary" | "default" }
> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "muted" },
  REFUNDED: { label: "Reembolsado", variant: "default" },
};

export default function PaymentsPage() {
  return (
    <RoleGate roles={[...STAFF_ROLES]}>
      <PaymentsPageContent />
    </RoleGate>
  );
}

function PaymentsPageContent() {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(todayDateInput);

  const paymentsKey = useTenantQueryKey(["payments"]);
  const plansKey = useTenantQueryKey(["membership-plans"]);

  const { data: paymentsPage, isLoading } = useQuery<PaginatedResult<Payment>>({
    queryKey: paymentsKey,
    queryFn: () => api.get<PaginatedResult<Payment>>("/payments?limit=500"),
  });
  const payments = paymentsPage?.items;

  const {
    members,
    activate: activateMembersPicker,
    isLoading: membersLoading,
    hasMore: membersHasMore,
  } = useMembersPicker();

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const selectedMember = useMemo(
    () => members.find((m) => m.id === memberId),
    [members, memberId],
  );

  // Valor sugerido: valor do plano do socio selecionado.
  const suggestedAmount = useMemo(() => {
    if (!selectedMember?.quotaPlan) return "";
    const plan = plans?.find((p) => p.id === selectedMember.quotaPlan?.id);
    return plan ? Number(plan.amount).toFixed(2) : "";
  }, [selectedMember, plans]);

  const createPayment = useMutation({
    mutationFn: () =>
      api.post<Payment>("/payments", {
        memberId,
        method,
        amount: amount ? Number(amount) : undefined,
        paidAt,
      }),
    onSuccess: () => {
      setMemberId("");
      setAmount("");
      setMethod("CASH");
      setPaidAt(todayDateInput());
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Pagamento registado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Pagamentos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Regista pagamentos de quotas e emite comprovativos em PDF.
      </p>

      <Card id="register-payment-form" className="mb-6">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (memberId) createPayment.mutate();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Sócio</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                onFocus={activateMembersPicker}
                onMouseDown={activateMembersPicker}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">
                  {membersLoading
                    ? "A carregar sócios..."
                    : "Selecionar sócio..."}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.number} - {m.name}
                  </option>
                ))}
              </select>
              {membersHasMore ? (
                <p className="text-xs text-muted-foreground">
                  A mostrar os primeiros 100 sócios. Use Membros para pesquisar
                  todos.
                </p>
              ) : null}
            </div>
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Valor (€)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder={suggestedAmount || "0.00"}
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium">Data do pagamento</label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Data do pagamento define o próximo vencimento.
              </p>
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium">Método</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              disabled={createPayment.isPending || !memberId}
            >
              {createPayment.isPending ? "A registar..." : "Registar pagamento"}
            </Button>
          </form>
          {selectedMember && suggestedAmount && !amount && (
            <p className="mt-2 text-xs text-muted-foreground">
              Valor do plano ({selectedMember.quotaPlan?.name}):{" "}
              {suggestedAmount} € — deixa vazio para usar este valor.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!isLoading && payments && payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Sem pagamentos registados"
              description="Registe o primeiro pagamento de quota para começar o histórico."
              actions={[
                {
                  label: "Registar pagamento",
                  onClick: () =>
                    document
                      .getElementById("register-payment-form")
                      ?.scrollIntoView({ behavior: "smooth" }),
                },
              ]}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Sócio</th>
                    <th className="p-3 font-medium">Plano</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Estado</th>
                    <th className="p-3 font-medium text-right">Comprovativo</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-muted-foreground"
                      >
                        A carregar...
                      </td>
                    </tr>
                  ) : payments && payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-3">
                          {new Date(p.paidAt ?? p.createdAt).toLocaleDateString(
                            "pt-PT",
                          )}
                        </td>
                        <td className="p-3 font-medium">{p.member.name}</td>
                        <td className="p-3">{p.quotaPlan?.name ?? "-"}</td>
                        <td className="p-3">{Number(p.amount).toFixed(2)} €</td>
                        <td className="p-3">{METHOD_LABEL[p.method]}</td>
                        <td className="p-3">
                          <Badge variant={STATUS_BADGE[p.status].variant}>
                            {STATUS_BADGE[p.status].label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openBlob(`/payments/${p.id}/receipt`)
                              }
                            >
                              <FileText className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
