'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Communication, CommunicationAudience, CommunicationStatus, MembershipPlan } from '@/lib/types';

const AUDIENCE_LABEL: Record<CommunicationAudience, string> = {
  ALL: 'Todos (com email)',
  ACTIVE: 'Sócios ativos',
  OVERDUE: 'Quotas em atraso',
  PLAN: 'Por plano',
};

const STATUS_BADGE: Record<CommunicationStatus, { label: string; variant: 'success' | 'secondary' | 'muted' | 'default' }> = {
  QUEUED: { label: 'Na fila', variant: 'secondary' },
  SENDING: { label: 'A enviar', variant: 'secondary' },
  SENT: { label: 'Enviado', variant: 'success' },
  FAILED: { label: 'Falhou', variant: 'default' },
};

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<CommunicationAudience>('ACTIVE');
  const [planId, setPlanId] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const { data: list, isLoading } = useQuery<Communication[]>({
    queryKey: ['communications'],
    queryFn: () => api.get<Communication[]>('/communications'),
    refetchInterval: 5000,
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: ['membership-plans'],
    queryFn: () => api.get<MembershipPlan[]>('/membership-plans'),
  });

  useEffect(() => {
    const params = new URLSearchParams({ audience });
    if (audience === 'PLAN' && planId) params.set('planId', planId);
    api
      .get<{ count: number }>(`/communications/preview?${params}`)
      .then((r) => setPreviewCount(r.count))
      .catch(() => setPreviewCount(null));
  }, [audience, planId]);

  const send = useMutation({
    mutationFn: () =>
      api.post<Communication>('/communications', {
        subject,
        body,
        audience,
        planId: audience === 'PLAN' ? planId : undefined,
      }),
    onSuccess: () => {
      setSubject('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Comunicações</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Envia avisos por email em massa via fila BullMQ (assíncrono).
      </p>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Audiência</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as CommunicationAudience)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(AUDIENCE_LABEL).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {audience === 'PLAN' && (
              <div>
                <label className="text-sm font-medium">Plano</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecionar...</option>
                  {(plans ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {previewCount !== null && (
            <p className="text-sm text-muted-foreground">
              Destinatários com email: <strong>{previewCount}</strong>
            </p>
          )}
          <div>
            <label className="text-sm font-medium">Assunto</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button
            onClick={() => send.mutate()}
            disabled={send.isPending || !subject.trim() || !body.trim() || (audience === 'PLAN' && !planId)}
          >
            {send.isPending ? 'A enfileirar...' : 'Enviar comunicação'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Data</th>
                <th className="p-3">Assunto</th>
                <th className="p-3">Audiência</th>
                <th className="p-3">Progresso</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    A carregar...
                  </td>
                </tr>
              ) : list && list.length > 0 ? (
                list.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">{new Date(c.createdAt).toLocaleString('pt-PT')}</td>
                    <td className="p-3 font-medium">{c.subject}</td>
                    <td className="p-3">{AUDIENCE_LABEL[c.audience]}</td>
                    <td className="p-3">
                      {c.sentCount}/{c.totalRecipients}
                      {c.failedCount > 0 && (
                        <span className="ml-1 text-destructive">({c.failedCount} falhas)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_BADGE[c.status].variant}>{STATUS_BADGE[c.status].label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Sem comunicações enviadas.
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
