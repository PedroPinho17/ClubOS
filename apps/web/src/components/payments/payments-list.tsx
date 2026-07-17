"use client";

import { CreditCard, FileText } from "lucide-react";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { safeOpenBlob } from "@/lib/safe-download";
import type { Payment } from "@/lib/types";
import { METHOD_LABEL, STATUS_BADGE } from "./payments-shared";

type PaymentsListProps = {
  payments: Payment[] | undefined;
  isLoading: boolean;
};

export function PaymentsList({ payments, isLoading }: PaymentsListProps) {
  return (
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
          <>
            <div className="hidden overflow-x-auto sm:block">
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
                    <TableBodySkeleton rows={6} cols={7} />
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
                              className="min-h-11"
                              aria-label={`Abrir comprovativo PDF de ${p.member.name}`}
                              onClick={() =>
                                void safeOpenBlob(`/payments/${p.id}/receipt`)
                              }
                            >
                              <FileText className="h-4 w-4" aria-hidden />
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

            <div className="space-y-3 p-4 sm:hidden">
              {isLoading ? (
                <MobileCardsSkeleton count={4} />
              ) : payments && payments.length > 0 ? (
                payments.map((p) => (
                  <div key={p.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{p.member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(p.paidAt ?? p.createdAt).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {Number(p.amount).toFixed(2)} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {METHOD_LABEL[p.method]}
                          {p.quotaPlan?.name ? ` · ${p.quotaPlan.name}` : ""}
                        </p>
                      </div>
                      <Badge variant={STATUS_BADGE[p.status].variant}>
                        {STATUS_BADGE[p.status].label}
                      </Badge>
                    </div>
                    <Button
                      className="mt-3 w-full min-h-11"
                      variant="outline"
                      size="sm"
                      aria-label={`Abrir comprovativo PDF de ${p.member.name}`}
                      onClick={() =>
                        void safeOpenBlob(`/payments/${p.id}/receipt`)
                      }
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      PDF
                    </Button>
                  </div>
                ))
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
