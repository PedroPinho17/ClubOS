'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { FileText, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { MemberCard } from '@/components/cards/member-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, openBlob } from '@/lib/api';
import { changePassword } from '@/lib/auth-client';
import type { PortalMe, QuotaStatus } from '@/lib/types';

const QUOTA_BADGE: Record<QuotaStatus, { label: string; variant: 'success' | 'muted' | 'secondary' | 'default' }> = {
  up_to_date: { label: 'Em dia', variant: 'success' },
  overdue: { label: 'Em atraso', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  no_plan: { label: 'Sem plano', variant: 'muted' },
};

export default function PortalPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data, isLoading, isError } = useQuery<PortalMe>({
    queryKey: ['portal', 'me'],
    queryFn: () => api.get<PortalMe>('/portal/me'),
  });

  const changePwd = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error('A nova password deve ter pelo menos 8 caracteres.');
      if (newPassword !== confirmPassword) throw new Error('As passwords não coincidem.');
      const res = await changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
      if (res.error) throw new Error(res.error.message ?? 'Não foi possível alterar a password.');
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password alterada com sucesso.');
    },
    onError: (err: Error) => alert(err.message),
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
                <th className="p-3 text-right">Recibo</th>
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
                    <td className="p-3 text-right">
                      {p.status === 'PAID' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBlob(`/portal/payments/${p.id}/receipt`)}
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Sem pagamentos registados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Alterar password</h2>
          </div>
          <form
            className="grid gap-3 sm:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              changePwd.mutate();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">Password atual</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nova password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirmar nova password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={changePwd.isPending || !currentPassword || !newPassword}>
              {changePwd.isPending ? 'A guardar...' : 'Guardar nova password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
