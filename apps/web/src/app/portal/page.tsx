'use client';

import { useQuery } from '@tanstack/react-query';
import { MemberCard } from '@/components/cards/member-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { PortalMe, QuotaStatus } from '@/lib/types';

const QUOTA_BADGE: Record<QuotaStatus, { label: string; variant: 'success' | 'muted' | 'secondary' | 'default' }> = {
  up_to_date: { label: 'Em dia', variant: 'success' },
  overdue: { label: 'Em atraso', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  no_plan: { label: 'Sem plano', variant: 'muted' },
};

export default function PortalPage() {
  const { data, isLoading, isError } = useQuery<PortalMe>({
    queryKey: ['portal', 'me'],
    queryFn: () => api.get<PortalMe>('/portal/me'),
  });

  if (isLoading) return <p className="text-muted-foreground">A carregar...</p>;
  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">A sua conta ainda não está associada a um sócio.</p>
          <p className="mt-2 text-sm text-muted-foreground">Contacte a administração do clube.</p>
        </CardContent>
      </Card>
    );
  }

  const q = QUOTA_BADGE[data.quotaSituation.status];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.member.name}</h1>
              <p className="text-muted-foreground">N.º {data.member.number}</p>
              {data.member.planName && <p className="mt-1 text-sm">Plano: {data.member.planName}</p>}
            </div>
            <Badge variant={q.variant}>{q.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {data.card && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <h2 className="self-start font-semibold">O meu cartão</h2>
            <MemberCard data={data.card} width={380} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <h2 className="border-b p-4 font-semibold">Os meus pagamentos</h2>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Data</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Método</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length > 0 ? (
                data.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">{new Date(p.paidAt ?? p.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td className="p-3">{p.amount} €</td>
                    <td className="p-3">{p.method}</td>
                    <td className="p-3">{p.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Sem pagamentos registados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
