'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, downloadCsv } from '@/lib/api';
import { useTenantQueryKey } from '@/hooks/use-tenant-query-key';
import type { QuotaStatus, ReportsOverview } from '@/lib/types';

const QUOTA_LABEL: Record<QuotaStatus, string> = {
  up_to_date: 'Em dia',
  overdue: 'Em atraso',
  pending: 'Pendente',
  no_plan: 'Sem plano',
};

export default function ReportsPage() {
  const overviewKey = useTenantQueryKey(['reports', 'overview']);
  const { data, isLoading } = useQuery<ReportsOverview>({
    queryKey: overviewKey,
    queryFn: () => api.get<ReportsOverview>('/reports/overview'),
  });

  const maxMonthly = Math.max(...(data?.revenue.monthly.map((m) => m.total) ?? [1]), 1);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão analítica e exportação CSV.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsv('/reports/members.csv', 'socios.csv')}>
            <Download className="h-4 w-4" />
            CSV Sócios
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv('/reports/payments.csv', 'pagamentos.csv')}>
            <Download className="h-4 w-4" />
            CSV Pagamentos
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Sócios</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <Stat label="Total" value={data.members.total} />
                <Stat label="Ativos" value={data.members.active} />
                <Stat label="Inativos" value={data.members.inactive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Receita</h2>
              <p className="text-3xl font-bold">{data.revenue.total.toFixed(2)} €</p>
              <p className="text-sm text-muted-foreground">{data.revenue.paymentsCount} pagamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Situação de quotas</h2>
              <div className="space-y-2">
                {(Object.keys(data.quotaBreakdown) as QuotaStatus[]).map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span>{QUOTA_LABEL[k]}</span>
                    <span className="font-semibold">{data.quotaBreakdown[k]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Sócios por plano</h2>
              <div className="space-y-2">
                {data.membersByPlan.map((row) => (
                  <div key={row.plan} className="flex items-center justify-between text-sm">
                    <span>{row.plan}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <h2 className="mb-4 font-semibold">Receita mensal (6 meses)</h2>
              <div className="flex h-40 items-end gap-2">
                {data.revenue.monthly.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${Math.max(4, (m.total / maxMonthly) * 100)}%` }}
                      title={`${m.total.toFixed(2)} €`}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
