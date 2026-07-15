"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, UserX, WifiOff } from "lucide-react";
import { MemberCard } from "@/components/cards/member-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { usePortalCardWidth } from "@/hooks/use-portal-card-width";
import { api } from "@/lib/api";
import { safeOpenBlob } from "@/lib/safe-download";
import { readPortalCache, writePortalCache } from "@/lib/portal-cache";
import {
  enrichPortalMeCache,
  PORTAL_ME_QUERY_KEY,
} from "@/lib/portal-branding";
import type { PortalMe, QuotaStatus } from "@/lib/types";

const QUOTA_BADGE: Record<
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

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Numerário",
  TRANSFER: "Transferência",
  CARD: "Cartão",
  MBWAY: "MB WAY",
  OTHER: "Outro",
};

export default function PortalPage() {
  const cardWidth = usePortalCardWidth();
  const [cached, setCached] = useState<PortalMe | null>(null);

  useEffect(() => {
    setCached(enrichPortalMeCache(readPortalCache<PortalMe>()) ?? null);
  }, []);

  const { data, isLoading, isError, isFetched } = useQuery<PortalMe>({
    queryKey: [...PORTAL_ME_QUERY_KEY],
    queryFn: () => api.get<PortalMe>("/portal/me"),
    retry: 1,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) writePortalCache(data);
  }, [data]);

  const display = data ?? (isError && cached ? cached : null);
  const offline = isError && !!cached;

  if (isLoading && !display) {
    return <p className="text-muted-foreground">A carregar...</p>;
  }

  if (!display) {
    if (isError && isFetched && !cached) {
      return (
        <Card>
          <CardContent>
            <EmptyState
              icon={WifiOff}
              title="Não foi possível carregar os dados"
              description="Verifique a ligação à internet e tente novamente dentro de momentos."
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={UserX}
            title="Conta sem dados de quota"
            description="A sua conta ainda não está associada a um sócio. Contacte a administração do clube."
          />
        </CardContent>
      </Card>
    );
  }

  const q = QUOTA_BADGE[display.quotaSituation.status];

  return (
    <div className="space-y-5">
      {offline && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <WifiOff className="h-4 w-4 shrink-0" />
          Sem ligação — a mostrar dados guardados. Ligue-se à internet para
          atualizar.
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {display.member.name}
              </h1>
              <p className="text-muted-foreground">
                N.º {display.member.number}
              </p>
              {display.member.planName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Plano: {display.member.planName}
                </p>
              )}
            </div>
            <Badge variant={q.variant} className="w-fit text-sm">
              {q.label}
            </Badge>
          </div>

          {display.quotaSituation.nextDueDate && (
            <p className="text-sm text-muted-foreground">
              Próximo vencimento:{" "}
              <strong className="text-foreground">
                {new Date(
                  display.quotaSituation.nextDueDate,
                ).toLocaleDateString("pt-PT")}
              </strong>
              {display.quotaSituation.daysUntilDue != null &&
                display.quotaSituation.daysUntilDue >= 0 && (
                  <> ({display.quotaSituation.daysUntilDue} dias)</>
                )}
              {display.quotaSituation.daysOverdue != null &&
                display.quotaSituation.daysOverdue > 0 && (
                  <> — {display.quotaSituation.daysOverdue} dias em atraso</>
                )}
            </p>
          )}
        </CardContent>
      </Card>

      {display.card && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <h2 className="self-start text-lg font-semibold">O meu cartão</h2>
            <MemberCard data={display.card} width={cardWidth} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <h2 className="border-b p-4 text-lg font-semibold">
            Os meus pagamentos
          </h2>

          {/* Desktop: tabela */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr className="text-left">
                  <th className="p-3">Data</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody>
                {display.payments.length > 0 ? (
                  display.payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3">
                        {new Date(p.paidAt ?? p.createdAt).toLocaleDateString(
                          "pt-PT",
                        )}
                      </td>
                      <td className="p-3">{p.amount} €</td>
                      <td className="p-3">
                        {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                      </td>
                      <td className="p-3">
                        {p.status === "PAID" ? "Pago" : p.status}
                      </td>
                      <td className="p-3 text-right">
                        {p.status === "PAID" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            disabled={offline}
                            onClick={() =>
                              void safeOpenBlob(
                                `/portal/payments/${p.id}/receipt`,
                              )
                            }
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Sem pagamentos registados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 p-4 sm:hidden">
            {display.payments.length > 0 ? (
              display.payments.map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{p.amount} €</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(p.paidAt ?? p.createdAt).toLocaleDateString(
                          "pt-PT",
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                      </p>
                    </div>
                    <Badge
                      variant={p.status === "PAID" ? "success" : "secondary"}
                    >
                      {p.status === "PAID" ? "Pago" : p.status}
                    </Badge>
                  </div>
                  {p.status === "PAID" && (
                    <Button
                      className="mt-3 w-full min-h-11"
                      variant="outline"
                      disabled={offline}
                      onClick={() =>
                        void safeOpenBlob(`/portal/payments/${p.id}/receipt`)
                      }
                    >
                      <FileText className="h-4 w-4" />
                      Descarregar recibo
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Sem pagamentos registados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isFetched && !data && !isError && (
        <p className="text-center text-xs text-muted-foreground">
          Dados atualizados
        </p>
      )}
    </div>
  );
}
