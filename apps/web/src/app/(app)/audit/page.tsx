"use client";

import { ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  "member.created": "Membro criado",
  "member.updated": "Membro atualizado",
  "member.deleted": "Membro apagado",
  "member.photo_updated": "Foto atualizada",
  "member.gdpr_export": "Export RGPD",
  "member.gdpr_erased": "Dados apagados (RGPD)",
  "member.import_dry_run": "Importação (simulação)",
  "member.imported": "Importação concluída",
  "payment.created": "Pagamento registado",
  "user.invited": "Utilizador convidado",
};

export default function AuditPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <AuditPageContent />
    </RoleGate>
  );
}

function AuditPageContent() {
  const auditKey = useTenantQueryKey(["audit"]);
  const { data, isPending, isError, refetch } = useQuery<AuditLogEntry[]>({
    queryKey: auditKey,
    queryFn: () => api.get<AuditLogEntry[]>("/audit?limit=200"),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Registo de ações na organização.
        </p>
      </div>

      {isError ? (
        <QueryErrorCard onRetry={() => void refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {!isPending && data && data.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Sem registos de auditoria"
                description="As acções na organização aparecerão aqui à medida que forem realizadas."
              />
            ) : (
              <>
                {/* Desktop: tabela */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Data</th>
                        <th className="p-3 font-medium">Utilizador</th>
                        <th className="p-3 font-medium">Ação</th>
                        <th className="p-3 font-medium">Entidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isPending && !data ? (
                        <TableBodySkeleton rows={8} cols={4} />
                      ) : data && data.length > 0 ? (
                        data.map((entry) => (
                          <tr key={entry.id} className="border-b last:border-0">
                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString(
                                "pt-PT",
                              )}
                            </td>
                            <td className="p-3">
                              {entry.user ? (
                                <div>
                                  <div className="font-medium">
                                    {entry.user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {entry.user.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Sistema
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary">
                                {ACTION_LABEL[entry.action] ?? entry.action}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {entry.entity ? (
                                <span>
                                  {entry.entity}
                                  {entry.entityId && (
                                    <span className="ml-1 font-mono text-xs">
                                      ({entry.entityId.slice(-8)})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: cards */}
                <div className="space-y-3 p-4 sm:hidden">
                  {isPending && !data ? (
                    <MobileCardsSkeleton count={5} />
                  ) : data && data.length > 0 ? (
                    data.map((entry) => (
                      <div key={entry.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString(
                                "pt-PT",
                              )}
                            </p>
                            <p className="mt-1 font-medium">
                              {entry.user ? entry.user.name : "Sistema"}
                            </p>
                            {entry.user && (
                              <p className="text-xs text-muted-foreground">
                                {entry.user.email}
                              </p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                              {entry.entity ? (
                                <>
                                  {entry.entity}
                                  {entry.entityId && (
                                    <span className="ml-1 font-mono text-xs">
                                      ({entry.entityId.slice(-8)})
                                    </span>
                                  )}
                                </>
                              ) : (
                                "—"
                              )}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {ACTION_LABEL[entry.action] ?? entry.action}
                          </Badge>
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
    </div>
  );
}
