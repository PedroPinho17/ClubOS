"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Pencil,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImportResultPanel } from "@/components/members/import-result-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { api, downloadBlob, downloadJson, uploadFile } from "@/lib/api";
import { formatDateInput, todayDateInput } from "@/lib/date-input";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type {
  Member,
  MemberImportResult,
  MembershipPlan,
  PaginatedResult,
  QuotaStatus,
} from "@/lib/types";

const PAGE_SIZE = 25;

const QUOTA_BADGE: Record<
  QuotaStatus,
  {
    label: string;
    variant: "success" | "muted" | "secondary" | "default" | "warning";
  }
> = {
  up_to_date: { label: "Em dia", variant: "success" },
  due_soon: { label: "A vencer", variant: "warning" },
  overdue: { label: "Em atraso", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  no_plan: { label: "Sem plano", variant: "muted" },
};

interface EditForm {
  name: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  quotaPlanId: string;
  cardRole: string;
  notes: string;
  joinedAt: string;
  cardValidUntil: string;
}

function emptyEditForm(): EditForm {
  return {
    name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    quotaPlanId: "",
    cardRole: "",
    notes: "",
    joinedAt: todayDateInput(),
    cardValidUntil: "",
  };
}

function memberToForm(m: Member): EditForm {
  return {
    name: m.name,
    email: m.email ?? "",
    phone: m.phone ?? "",
    status: m.status,
    quotaPlanId: m.quotaPlan?.id ?? "",
    cardRole: m.cardRole ?? "",
    notes: m.notes ?? "",
    joinedAt: m.joinedAt ? formatDateInput(m.joinedAt) : todayDateInput(),
    cardValidUntil: m.cardValidUntil ? formatDateInput(m.cardValidUntil) : "",
  };
}

function isGdprErased(m: Member): boolean {
  return m.name === "Apagado RGPD";
}

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = ["imperador", "administrador"].includes(
    session?.user?.role ?? "",
  );
  const canExportReports = [
    "imperador",
    "administrador",
    "tesoureiro",
  ].includes(session?.user?.role ?? "");
  const importInputRef = useRef<HTMLInputElement>(null);
  const pendingImportFileRef = useRef<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importDryRun, setImportDryRun] = useState(false);
  const [importResult, setImportResult] = useState<MemberImportResult | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quotaPlanId, setQuotaPlanId] = useState("");
  const [joinedAt, setJoinedAt] = useState(todayDateInput);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());
  const [portalGrantMember, setPortalGrantMember] = useState<Member | null>(
    null,
  );
  const [portalPassword, setPortalPassword] = useState("");

  const membersKey = useTenantQueryKey(["members", search, page]);
  const plansKey = useTenantQueryKey(["membership-plans"]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const {
    data: membersPage,
    isPending,
    isFetching,
    isPlaceholderData,
  } = useQuery<PaginatedResult<Member>>({
    queryKey: membersKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      return api.get<PaginatedResult<Member>>(`/members?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const members = membersPage?.items ?? [];
  const isInitialLoad = isPending && !membersPage;
  const isPageTransition = isFetching && isPlaceholderData;

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["members"] });

  const createMember = useMutation({
    mutationFn: () =>
      api.post<Member>("/members", {
        name,
        email: email || undefined,
        quotaPlanId: quotaPlanId || undefined,
        joinedAt,
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setQuotaPlanId("");
      setJoinedAt(todayDateInput());
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
        joinedAt: editForm.joinedAt,
        cardValidUntil: editForm.cardValidUntil || null,
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
    mutationFn: ({
      memberId,
      password,
    }: {
      memberId: string;
      password: string;
    }) =>
      api.post<{ email: string; mustChangePassword: boolean }>(
        `/portal/access/${memberId}`,
        {
          password,
        },
      ),
    onSuccess: (res) => {
      setPortalGrantMember(null);
      setPortalPassword("");
      alert(
        `Acesso criado para ${res.email}.\n\n` +
          "Comunique a password ao sócio. No primeiro login terá de definir uma nova (mín. 12 caracteres).",
      );
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
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) =>
      uploadFile<MemberImportResult>("/members/import", file, {
        updateExisting: updateExisting ? "true" : "false",
        dryRun: dryRun ? "true" : "false",
      }),
    onSuccess: (res) => {
      if (!res.dryRun) {
        invalidate();
        pendingImportFileRef.current = null;
      }
      setImportResult(res);
    },
    onError: (err: Error) => alert(err.message),
  });

  function runImport(file: File, dryRun: boolean) {
    pendingImportFileRef.current = file;
    importMembers.mutate({ file, dryRun });
  }

  function confirmRealImport() {
    const file = pendingImportFileRef.current;
    if (!file) return;
    importMembers.mutate({ file, dryRun: false });
  }

  const gdprErase = useMutation({
    mutationFn: (memberId: string) =>
      api.post(`/members/${memberId}/gdpr-erase`, { confirm: true }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err: Error) => alert(err.message),
  });

  function confirmGdprErase(m: Member) {
    const msg =
      `Apagar dados pessoais de "${m.name}" (n.º ${m.number})?\n\n` +
      "O nome sera anonimizado, contactos removidos e o acesso ao portal desativado. " +
      "Os registos de pagamento mantem-se para contabilidade. Esta acao e irreversivel.";
    if (
      window.confirm(msg) &&
      window.confirm("Confirmar definitivamente o apagamento RGPD?")
    ) {
      gdprErase.mutate(m.id);
    }
  }

  function memberInitials(name: string): string {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditForm(memberToForm(m));
  }

  function confirmDelete(m: Member) {
    if (
      window.confirm(
        `Apagar o sócio "${m.name}" (n.º ${m.number})? Esta ação é irreversível.`,
      )
    ) {
      deleteMember.mutate(m.id);
    }
  }

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>

      {canExportReports && (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div>
              <h2 className="font-semibold">Relatórios de quota</h2>
              <p className="text-sm text-muted-foreground">
                Exportar sócios pagantes (em dia) ou em atraso — PDF ou Excel
                (CSV).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob(
                    "/reports/members/paying.pdf",
                    "socios_pagantes.pdf",
                  )
                }
              >
                <FileText className="h-4 w-4" />
                Pagantes PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob(
                    "/reports/members/paying.csv",
                    "socios_pagantes.csv",
                  )
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                Pagantes Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob(
                    "/reports/members/overdue.pdf",
                    "socios_em_atraso.pdf",
                  )
                }
              >
                <FileText className="h-4 w-4" />
                Em atraso PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadBlob(
                    "/reports/members/overdue.csv",
                    "socios_em_atraso.csv",
                  )
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
                  Excel (.xlsx) com o mesmo modelo do gestao_socios — sócios e
                  pagamentos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canExportReports && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/members/export",
                        "socios_exportacao.xlsx",
                      )
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar todos
                  </Button>
                )}
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/members/import/template",
                        "modelo_importacao_socios.xlsx",
                      )
                    }
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
                    if (file) runImport(file, importDryRun);
                    e.target.value = "";
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
                      ? "A simular..."
                      : "A importar..."
                    : importDryRun
                      ? "Simular importação"
                      : "Importar Excel"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {importResult && (
        <div className="mb-6">
          <ImportResultPanel
            result={importResult}
            isConfirming={importMembers.isPending}
            onDismiss={() => {
              setImportResult(null);
              pendingImportFileRef.current = null;
            }}
            onConfirmImport={
              importResult.dryRun && pendingImportFileRef.current
                ? confirmRealImport
                : undefined
            }
          />
        </div>
      )}

      {editingId && (
        <Card className="mb-6 border-primary/40">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Editar sócio</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(null)}
              >
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
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Plano</label>
                <select
                  value={editForm.quotaPlanId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, quotaPlanId: e.target.value }))
                  }
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
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as "ACTIVE" | "INACTIVE",
                    }))
                  }
                  className={selectClass}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de adesão</label>
                <Input
                  type="date"
                  value={editForm.joinedAt}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, joinedAt: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Adesão usada na quota se não houver pagamentos.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Validade cartão</label>
                <Input
                  type="date"
                  value={editForm.cardValidUntil}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      cardValidUntil: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Sobrepõe o cálculo automático da validade.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cargo no cartão</label>
                <Input
                  value={editForm.cardRole}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, cardRole: e.target.value }))
                  }
                  placeholder="Sócio"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Notas</label>
                <Input
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={updateMember.isPending}>
                  {updateMember.isPending
                    ? "A guardar..."
                    : "Guardar alterações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
              {canManage && editingId && editForm.name !== "Apagado RGPD" && (
                <div className="mt-4 rounded-lg border border-dashed p-4 sm:col-span-2">
                  <h3 className="mb-1 text-sm font-semibold">RGPD</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Exportar ou apagar dados pessoais deste socio
                    (administradores).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void downloadJson(
                          `/members/${editingId}/gdpr-export`,
                          `gdpr-export-${editingId}.json`,
                        )
                      }
                    >
                      <FileDown className="h-4 w-4" />
                      Exportar RGPD
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={gdprErase.isPending}
                      onClick={() => {
                        const m = members.find((x) => x.id === editingId);
                        if (m) confirmGdprErase(m);
                      }}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      {gdprErase.isPending
                        ? "A apagar..."
                        : "Apagar dados RGPD"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <Card id="create-member-form" className="mb-6">
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do membro"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.pt"
              />
            </div>
            <div className="w-44 space-y-1">
              <label className="text-sm font-medium">Data de adesão</label>
              <Input
                type="date"
                value={joinedAt}
                onChange={(e) => setJoinedAt(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Adesão usada na quota se não houver pagamentos.
              </p>
            </div>
            <div className="w-44 space-y-1">
              <label className="text-sm font-medium">Plano</label>
              <select
                value={quotaPlanId}
                onChange={(e) => setQuotaPlanId(e.target.value)}
                className={selectClass}
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
            <Button
              type="submit"
              disabled={createMember.isPending || !name.trim()}
            >
              <UserPlus className="h-4 w-4" />
              {createMember.isPending ? "A criar..." : "Adicionar membro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar membros..."
          />
        </div>
        {membersPage && membersPage.total > 0 && (
          <p className="text-sm text-muted-foreground">
            {membersPage.total} membro{membersPage.total !== 1 ? "s" : ""}
            {isPageTransition ? " · A actualizar..." : ""}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {!isInitialLoad && membersPage?.total === 0 && !search ? (
            <EmptyState
              icon={Users}
              title="Ainda não há sócios nesta organização"
              description="Importe a lista do Excel ou crie o primeiro sócio."
              actions={[
                ...(canManage
                  ? [
                      {
                        label: "Importar Excel",
                        variant: "outline" as const,
                        onClick: () => importInputRef.current?.click(),
                      },
                      {
                        label: "Criar sócio",
                        onClick: () =>
                          document
                            .getElementById("create-member-form")
                            ?.scrollIntoView({ behavior: "smooth" }),
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div
              className={cn(
                "overflow-x-auto transition-opacity",
                isPageTransition && "pointer-events-none opacity-60",
              )}
            >
              <table className="w-full min-w-[720px] text-sm">
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
                  {isInitialLoad ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-6 text-center text-muted-foreground"
                      >
                        A carregar...
                      </td>
                    </tr>
                  ) : members.length > 0 ? (
                    members.map((m) => (
                      <tr
                        key={m.id}
                        className={`border-b last:border-0 ${editingId === m.id ? "bg-primary/5" : ""}`}
                      >
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
                                disabled={
                                  uploadPhoto.isPending || isGdprErased(m)
                                }
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f)
                                    uploadPhoto.mutate({
                                      memberId: m.id,
                                      file: f,
                                    });
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-3 font-medium">
                          {m.name}
                          {isGdprErased(m) && (
                            <Badge variant="muted" className="ml-2">
                              RGPD
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {m.email ?? "-"}
                        </td>
                        <td className="p-3">{m.quotaPlan?.name ?? "-"}</td>
                        <td className="p-3">
                          {m.quotaSituation ? (
                            <Badge
                              variant={
                                QUOTA_BADGE[m.quotaSituation.status].variant
                              }
                            >
                              {QUOTA_BADGE[m.quotaSituation.status].label}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              m.status === "ACTIVE" ? "success" : "muted"
                            }
                          >
                            {m.status === "ACTIVE" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(m)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!isGdprErased(m) && (
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
                            )}
                            {canManage && !isGdprErased(m) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Exportar RGPD"
                                onClick={() =>
                                  void downloadJson(
                                    `/members/${m.id}/gdpr-export`,
                                    `gdpr-export-${m.id}.json`,
                                  )
                                }
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                            )}
                            {m.userId ? (
                              <Badge variant="success" className="ml-1">
                                Portal
                              </Badge>
                            ) : m.email && !isGdprErased(m) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={grantPortal.isPending}
                                onClick={() => {
                                  setPortalGrantMember(m);
                                  setPortalPassword("");
                                }}
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
                      <td
                        colSpan={8}
                        className="p-6 text-center text-muted-foreground"
                      >
                        {search
                          ? "Nenhum sócio encontrado para esta pesquisa."
                          : "Sem sócios."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {membersPage && membersPage.totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {membersPage.page} de {membersPage.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPageTransition}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= membersPage.totalPages || isPageTransition}
              onClick={() => setPage((p) => p + 1)}
            >
              {isPageTransition ? "A carregar..." : "Seguinte"}
            </Button>
          </div>
        </div>
      )}

      {portalGrantMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h2 className="text-lg font-semibold">Acesso ao portal</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {portalGrantMember.name} — {portalGrantMember.email}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="portal-password"
                  className="text-sm font-medium"
                >
                  Password inicial
                </label>
                <Input
                  id="portal-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  O sócio terá de alterar esta password no primeiro login (mín.
                  12 caracteres).
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPortalGrantMember(null);
                    setPortalPassword("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={portalPassword.length < 8 || grantPortal.isPending}
                  onClick={() =>
                    grantPortal.mutate({
                      memberId: portalGrantMember.id,
                      password: portalPassword,
                    })
                  }
                >
                  {grantPortal.isPending ? "A criar..." : "Criar acesso"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
