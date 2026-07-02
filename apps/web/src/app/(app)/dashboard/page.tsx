'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  });

  const cards = [
    { label: 'Membros', value: data?.members ?? 0 },
    { label: 'Membros ativos', value: data?.activeMembers ?? 0 },
    { label: 'Pagamentos', value: data?.payments ?? 0 },
    { label: 'Receita', value: `${(data?.revenue ?? 0).toFixed(2)} EUR` },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? '...' : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
