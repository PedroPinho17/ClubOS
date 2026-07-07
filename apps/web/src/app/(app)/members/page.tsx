'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, ImagePlus, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, downloadBlob, uploadFile } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { useTenantQueryKey } from '@/hooks/use-tenant-query-key';
import type { Member, MemberImportResult, MembershipPlan, QuotaStatus } from '@/lib/types';

const QUOTA_BADGE: Record<QuotaStatus, { label: string; variant: 'success' | 'muted' | 'secondary' | 'default' | 'warning' }> = {
  up_to_date: { label: 'Em dia', variant: 'success' },
  due_soon: { label: 'A vencer', variant: 'warning' },
  overdue: { label: 'Em atraso', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  no_plan: { label: 'Sem plano', variant: 'muted' },
};

interface EditForm {
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  quotaPlanId: string;
  cardRole: string;
  notes: string;
}

function emptyEditForm(): EditForm {
  return { name: '', email: '', phone: '', status: 'ACTIVE', quotaPlanId: '', cardRole: '', notes: '' };
}

function memberToForm(m: Member): EditForm {
  return {
    name: m.name,
    email: m.email ?? '',
    phone: m.phone ?? '',
    status: m.status,
    quotaPlanId: m.quotaPlan?.id ?? '',
    cardRole: m.cardRole ?? '',
    notes: m.notes ?? '',
  };
}

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = ['imperador', 'administrador'].includes(session?.user?.role ?? '');
  const canExportReports = ['imperador', 'administrador', 'tesoureiro'].includes(session?.user?.role ?? '');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importDryRun, setImportDryRun] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quotaPlanId, setQuotaPlanId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());

  const membersKey = useTenantQueryKey(['members', search]);
  const plansKey = useTenantQueryKey(['membership-plans']);

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: membersKey,
    queryFn: () => api.get<Member[]>(`/members${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>('/membership-plans'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['members'] });

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
      invalidate();
    },
  });

  const updateMember = useMutation({
    mutationFn: () =>
      api.patch<Member>(`/members/${editingId}`, {
        name: editForm.name,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        status: editForm.status,
        quotaPlanId: editForm.quotaPlanId || null,
        cardRole: editForm.cardRole || undefined,
        notes: editForm.notes || undefined,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err: Error) => alert(err.message),
  });

  const grantPortal = useMutation({
    mutationFn: (memberId: string) =>
      api.post<{ email: string; tempPassword: string }>(`/portal/access/${memberId}`),
    onSuccess: (res) => {
      alert(`Acesso criado. Email: ${res.email}\nPassword temporária: ${res.tempPassword}`);
      invalidate();
    },
    onError: (err: Error) => alert(err.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ memberId, file }: { memberId: string; file: File }) =>
      uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: invalidate,
    onError: (err: Error) => alert(err.message),
  });

  const importMembers = useMutation({
    mutationFn: (file: File) =>
      uploadFile<MemberImportResult>('/members/import', file, {
        updateExisting: updateExisting ? 'true' : 'false',
        dryRun: importDryRun ? 'true' : 'false',
      }),
    onSuccess: (res) => {
      if (!res.dryRun) invalidate();
      const errLines =
        res.errors.length > 0
          ? `\n\nErros (${res.errors.length}):\n${res.errors
              .slice(0, 8)
              .map((e) => `Linha ${e.row}: ${e.message}`)
              .join('\n')}${res.errors.length > 8 ? '\n...' : ''}`
          : '';
      alert(
        `${res.dryRun ? 'Simulação (dry-run)' : 'Importação concluída'}.\nCriados: ${res.created}\nAtualizados: ${res.updated}\nPagamentos: ${res.payments}\nIgnorados: ${res.skipped}${errLines}`,
      );
    },
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

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditForm(memberToForm(m));
  }

  function confirmDelete(m: Member) {
    if (window.confirm(`Apagar o sócio "${m.name}" (n.º ${m.number})? Esta ação é irreversível.`)) {
      deleteMember.mutate(m.id);
    }
  }

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>

      {canExportReports && (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div>
              <h2 className="font-semibold">Relatórios de quota</h2>
              <p className="text-sm text-muted-foreground">
                Exportar sócios pagantes (em dia) ou em atraso — PDF ou Excel (CSV).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void downloadBlob('/reports/members/paying.pdf', 'socios_pagantes.pdf')}
              >
                <FileText className="h-4 w-4" />
                Pagantes PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob('/reports/members/paying.csv', 'socios_pagantes.csv')
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                Pagantes Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void downloadBlob('/reports/members/overdue.pdf', 'socios_em_atraso.pdf')}
              >
                <FileText className="h-4 w-4" />
                Em atraso PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob('/reports/members/overdue.csv', 'socios_em_atraso.csv')
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                Em atraso Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(canManage || canExportReports) && (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Importar / Exportar</h2>
                <p className="text-sm text-muted-foreground">
                  Excel (.xlsx) com o mesmo modelo do gestao_socios — sócios e pagamentos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canExportReports && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadBlob('/members/export', 'socios_exportacao.xlsx')}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar todos
                  </Button>
                )}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadBlob('/members/import/template', 'modelo_importacao_socios.xlsx')}
                  >
                    <Download className="h-4 w-4" />
                    Modelo Excel
                  </Button>
                )}
              </div>
            </div>
            {canManage && (
              <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={importDryRun}
                onChange={(e) => setImportDryRun(e.target.checked)}
              />
              Simular importação (dry-run) — não grava na base de dados
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
              />
              Actualizar sócios existentes (por número)
            </label>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importMembers.mutate(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              disabled={importMembers.isPending}
              onClick={() => importInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {importMembers.isPending
                ? importDryRun
                  ? 'A simular...'
                  : 'A importar...'
                : importDryRun
                  ? 'Simular importação'
                  : 'Importar Excel'}
            </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {editingId && (
        <Card className="mb-6 border-primary/40">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Editar sócio</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (editForm.name.trim()) updateMember.mutate();
              }}
            >
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Plano</label>
                <select
                  value={editForm.quotaPlanId}
                  onChange={(e) => setEditForm((f) => ({ ...f, quotaPlanId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Sem plano</option>
                  {(plans ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))
                  }
                  className={selectClass}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cargo no cartão</label>
                <Input
                  value={editForm.cardRole}
                  onChange={(e) => setEditForm((f) => ({ ...f, cardRole: e.target.value }))}
                  placeholder="Sócio"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={updateMember.isPending}>
                  {updateMember.isPending ? 'A guardar...' : 'Guardar alterações'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <select value={quotaPlanId} onChange={(e) => setQuotaPlanId(e.target.value)} className={selectClass}>
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
              <UserPlus className="h-4 w-4" />
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
                <th className="p-3 font-medium text-right">Ações</th>
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
                  <tr key={m.id} className={`border-b last:border-0 ${editingId === m.id ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">{m.number}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {m.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photoUrl} alt={m.name} className="h-9 w-9 rounded-md border object-cover" />
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
                    <td className="p-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(m)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(m)}
                          disabled={deleteMember.isPending}
                          title="Apagar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {m.userId ? (
                          <Badge variant="success" className="ml-1">
                            Portal
                          </Badge>
                        ) : m.email ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={grantPortal.isPending}
                            onClick={() => grantPortal.mutate(m.id)}
                          >
                            Dar acesso
                          </Button>
                        ) : null}
                      </div>
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
