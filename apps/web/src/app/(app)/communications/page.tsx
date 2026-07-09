'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useTenantQueryKey } from '@/hooks/use-tenant-query-key';
import type {
  Communication,
  CommunicationAudience,
  CommunicationStatus,
  MembershipPlan,
  WhatsappLink,
} from '@/lib/types';

const AUDIENCE_LABEL: Record<CommunicationAudience, string> = {
  ALL: 'Todos',
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

type Channel = 'email' | 'whatsapp';

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<CommunicationAudience>('ACTIVE');
  const [planId, setPlanId] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsappLink[]>([]);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const communicationsKey = useTenantQueryKey(['communications']);
  const plansKey = useTenantQueryKey(['membership-plans']);

  const { data: list, isLoading } = useQuery<Communication[]>({
    queryKey: communicationsKey,
    queryFn: () => api.get<Communication[]>('/communications'),
    refetchInterval: 5000,
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>('/membership-plans'),
  });

  useEffect(() => {
    const params = new URLSearchParams({ audience });
    if (audience === 'PLAN' && planId) params.set('planId', planId);
    const previewPath =
      channel === 'whatsapp' ? `/communications/preview/whatsapp?${params}` : `/communications/preview?${params}`;
    api
      .get<{ count: number }>(previewPath)
      .then((r) => setPreviewCount(r.count))
      .catch(() => setPreviewCount(null));
    setWhatsappLinks([]);
    setEmailPreviewHtml(null);
  }, [audience, planId, channel]);

  const previewEmail = useMutation({
    mutationFn: () =>
      api.post<{ html: string; text: string; sampleName: string }>('/communications/preview/email', {
        subject,
        body,
      }),
    onSuccess: (res) => {
      setEmailPreviewHtml(res.html);
      setShowPreview(true);
    },
    onError: (err: Error) => alert(err.message),
  });

  const sendEmail = useMutation({
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
      setEmailPreviewHtml(null);
      setShowPreview(false);
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });

  const generateWhatsapp = useMutation({
    mutationFn: () =>
      api.post<{ links: WhatsappLink[] }>('/communications/whatsapp', {
        body,
        audience,
        planId: audience === 'PLAN' ? planId : undefined,
      }),
    onSuccess: (res) => setWhatsappLinks(res.links),
    onError: (err: Error) => alert(err.message),
  });

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Comunicações</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Email em massa (fila) ou links WhatsApp <code className="text-xs">wa.me</code> (semi-manual, um a um).
      </p>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={channel === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannel('email')}
            >
              Email
            </Button>
            <Button
              type="button"
              variant={channel === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannel('whatsapp')}
            >
              WhatsApp
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Audiência</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value as CommunicationAudience)} className={selectClass}>
                {(Object.keys(AUDIENCE_LABEL) as CommunicationAudience[]).map((k) => (
                  <option key={k} value={k}>
                    {AUDIENCE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            {audience === 'PLAN' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Plano</label>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={selectClass}>
                  <option value="">—</option>
                  {plans?.map((p) => (
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
              Destinatários: <strong>{previewCount}</strong>{' '}
              {channel === 'email' ? '(com email)' : '(com telemóvel válido)'}
            </p>
          )}

          {channel === 'email' && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Assunto</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className={selectClass}
            />
          </div>

          {channel === 'email' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={previewEmail.isPending || !subject.trim() || !body.trim()}
                onClick={() => previewEmail.mutate()}
              >
                {previewEmail.isPending ? 'A gerar...' : 'Pré-visualizar email'}
              </Button>
              <Button
                disabled={sendEmail.isPending || !subject.trim() || !body.trim() || (audience === 'PLAN' && !planId)}
                onClick={() => sendEmail.mutate()}
              >
                {sendEmail.isPending ? 'A enviar...' : 'Enviar email'}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              disabled={generateWhatsapp.isPending || !body.trim() || (audience === 'PLAN' && !planId)}
              onClick={() => generateWhatsapp.mutate()}
            >
              {generateWhatsapp.isPending ? 'A gerar...' : 'Gerar links WhatsApp'}
            </Button>
          )}

          {showPreview && emailPreviewHtml && channel === 'email' && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pré-visualização do email</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  Fechar
                </Button>
              </div>
              <div
                className="max-h-96 overflow-auto rounded-lg border bg-white p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
              />
            </div>
          )}

          {whatsappLinks.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">{whatsappLinks.length} link(s) — clique para abrir no WhatsApp</p>
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {whatsappLinks.map((link) => (
                  <li key={`${link.phone}-${link.name}`} className="flex items-center justify-between gap-2 rounded border p-2">
                    <span>
                      {link.name} <span className="text-muted-foreground">({link.phone})</span>
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-700 hover:underline"
                    >
                      Abrir <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-semibold">Histórico (email)</h2>
          {isLoading ? (
            <p className="text-muted-foreground">A carregar...</p>
          ) : list && list.length > 0 ? (
            <div className="overflow-x-auto">
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
                      {new Date(c.createdAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 font-medium">{c.subject}</td>
                    <td className="py-3">{AUDIENCE_LABEL[c.audience]}</td>
                    <td className="py-3">
                      <span className="text-green-700">{c.sentCount}</span>
                      {' / '}
                      {c.totalRecipients}
                      {c.failedCount > 0 && (
                        <span className="ml-1 text-destructive">({c.failedCount} falhou)</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge variant={STATUS_BADGE[c.status].variant}>{STATUS_BADGE[c.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <EmptyState
              icon={Mail}
              title="Ainda não enviou comunicações"
              description="Envie o primeiro email aos sócios usando o formulário acima."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
