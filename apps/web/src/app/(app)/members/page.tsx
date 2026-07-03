'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, uploadFile } from '@/lib/api';
import type { Member, MembershipPlan, QuotaStatus } from '@/lib/types';

const QUOTA_BADGE: Record<QuotaStatus, { label: string; variant: 'success' | 'muted' | 'secondary' | 'default' }> = {
  up_to_date: { label: 'Em dia', variant: 'success' },
  overdue: { label: 'Em atraso', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  no_plan: { label: 'Sem plano', variant: 'muted' },
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quotaPlanId, setQuotaPlanId] = useState('');

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['members', search],
    queryFn: () => api.get<Member[]>(`/members${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: ['membership-plans'],
    queryFn: () => api.get<MembershipPlan[]>('/membership-plans'),
  });

  const createMember = useMutation({
    mutationFn: () =>
      api.post<Member>('/members', {
        name,
        email: email || undefined,
        quotaPlanId: quotaPlanId || undefined,
      }),
    onSuccess: () => {
      setName('');
      setEmail('');
      setQuotaPlanId('');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const grantPortal = useMutation({
    mutationFn: (memberId: string) =>
      api.post<{ email: string; tempPassword: string }>(`/portal/access/${memberId}`),
    onSuccess: (res) => {
      alert(`Acesso criado. Email: ${res.email}\nPassword temporária: ${res.tempPassword}`);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ memberId, file }: { memberId: string; file: File }) =>
      uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
    onError: (err: Error) => alert(err.message),
  });

  function memberInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) createMember.mutate();
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do membro" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.pt" />
            </div>
            <div className="w-44 space-y-1">
              <label className="text-sm font-medium">Plano</label>
              <select
                value={quotaPlanId}
                onChange={(e) => setQuotaPlanId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sem plano</option>
                {(plans ?? [])
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button type="submit" disabled={createMember.isPending || !name.trim()}>
              {createMember.isPending ? 'A criar...' : 'Adicionar membro'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 max-w-sm">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar membros..." />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Nº</th>
                <th className="p-3 font-medium">Foto</th>
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Quota</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium text-right">Portal</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    A carregar...
                  </td>
                </tr>
              ) : members && members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-3">{m.number}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {m.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.photoUrl}
                            alt={m.name}
                            className="h-9 w-9 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
                            {memberInitials(m.name)}
                          </div>
                        )}
                        <label className="inline-flex cursor-pointer items-center rounded-md border border-input p-1.5 hover:bg-muted">
                          <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            disabled={uploadPhoto.isPending}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadPhoto.mutate({ memberId: m.id, file: f });
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-muted-foreground">{m.email ?? '-'}</td>
                    <td className="p-3">{m.quotaPlan?.name ?? '-'}</td>
                    <td className="p-3">
                      {m.quotaSituation ? (
                        <Badge variant={QUOTA_BADGE[m.quotaSituation.status].variant}>
                          {QUOTA_BADGE[m.quotaSituation.status].label}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'muted'}>
                        {m.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {m.userId ? (
                        <Badge variant="success">Com acesso</Badge>
                      ) : m.email ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={grantPortal.isPending}
                          onClick={() => grantPortal.mutate(m.id)}
                        >
                          Dar acesso
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem email</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Sem membros.
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
