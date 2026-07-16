"use client";

import { Mail } from "lucide-react";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { QueryErrorCard } from "@/components/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Communication } from "@/lib/types";
import { AUDIENCE_LABEL, STATUS_BADGE } from "./communications-shared";

type CommunicationsHistoryListProps = {
  list: Communication[] | undefined;
  listLoading: boolean;
  listError: boolean;
  onRetryList: () => void;
};

export function CommunicationsHistoryList({
  list,
  listLoading,
  listError,
  onRetryList,
}: CommunicationsHistoryListProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 font-semibold">Histórico (email)</h2>
        {listError ? (
          <QueryErrorCard onRetry={onRetryList} />
        ) : listLoading ? (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Assunto</th>
                    <th className="pb-2 font-medium">Audiência</th>
                    <th className="pb-2 font-medium">Progresso</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <TableBodySkeleton rows={4} cols={5} />
                </tbody>
              </table>
            </div>
            <div className="sm:hidden">
              <MobileCardsSkeleton count={3} />
            </div>
          </>
        ) : list && list.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Assunto</th>
                    <th className="pb-2 font-medium">Audiência</th>
                    <th className="pb-2 font-medium">Progresso</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString("pt-PT")}
                      </td>
                      <td className="py-3 font-medium">{c.subject}</td>
                      <td className="py-3">{AUDIENCE_LABEL[c.audience]}</td>
                      <td className="py-3">
                        <span className="text-green-700 dark:text-green-400">
                          {c.sentCount}
                        </span>
                        {" / "}
                        {c.totalRecipients}
                        {c.failedCount > 0 && (
                          <span className="ml-1 text-destructive">
                            ({c.failedCount} falhou)
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={STATUS_BADGE[c.status].variant}>
                          {STATUS_BADGE[c.status].label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {list.map((c) => (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{c.subject}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString("pt-PT")}
                      </p>
                      <p className="mt-1 text-sm">
                        {AUDIENCE_LABEL[c.audience]}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-green-700 dark:text-green-400">
                          {c.sentCount}
                        </span>
                        {" / "}
                        {c.totalRecipients}
                        {c.failedCount > 0 && (
                          <span className="ml-1 text-destructive">
                            ({c.failedCount} falhou)
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[c.status].variant}>
                      {STATUS_BADGE[c.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Mail}
            title="Sem histórico de envios"
            description="Envie o primeiro email aos sócios usando o formulário acima."
          />
        )}
      </CardContent>
    </Card>
  );
}
