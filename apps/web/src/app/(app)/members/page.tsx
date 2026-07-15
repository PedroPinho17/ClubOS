"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { UserPlus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConsultModeBanner } from "@/components/consult-mode-banner";
import { QueryErrorCard } from "@/components/query-error-card";
import { ImportResultPanel } from "@/components/members/import-result-panel";
import { MemberEditDialog } from "@/components/members/member-edit-dialog";
import {
  MemberFilters,
  type MemberPlanFilter,
  type MemberStatusFilter,
} from "@/components/members/member-filters";
import { MembersTable } from "@/components/members/members-table";
import { MembersToolsPanel } from "@/components/members/members-tools-panel";
import {
  emptyEditForm,
  memberToForm,
  PAGE_SIZE,
  SELECT_CLASS,
} from "@/components/members/members-shared";
import { PortalGrantDialog } from "@/components/members/portal-grant-dialog";
import { RoleGate } from "@/components/role-gate";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { todayDateInput } from "@/lib/date-input";
import { toast } from "@/lib/toast";
import { STAFF_ROLES } from "@/lib/staff-roles";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useMembersMutations } from "@/hooks/use-members-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import {
  canAccessCards as hasCardAccess,
  canExportReports as hasReportExport,
  canManageMembers,
} from "@/lib/permissions";
import type {
  Member,
  MemberImportResult,
  MembershipPlan,
  PaginatedResult,
  QuotaStatus,
} from "@/lib/types";

export default function MembersPage() {
  return (
    <RoleGate roles={[...STAFF_ROLES]}>
      <MembersPageContent />
    </RoleGate>
  );
}

function MembersPageContent() {
  const { effectiveRole, isLoading: roleLoading } = useEffectiveRole();
  const canManage = !roleLoading && canManageMembers(effectiveRole);
  const canExportReports = !roleLoading && hasReportExport(effectiveRole);
  const canAccessCards = !roleLoading && hasCardAccess(effectiveRole);

  const {
    createMember,
    updateMember,
    deleteMember,
    grantPortal,
    uploadPhoto,
    importMembers,
    gdprErase,
  } = useMembersMutations();

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
  const [quotaFilter, setQuotaFilter] = useState<QuotaStatus | "">("");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("");
  const [planFilter, setPlanFilter] = useState<MemberPlanFilter>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quotaPlanId, setQuotaPlanId] = useState("");
  const [joinedAt, setJoinedAt] = useState(todayDateInput);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm());
  const [portalGrantMember, setPortalGrantMember] = useState<Member | null>(
    null,
  );
  const [portalPassword, setPortalPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [gdprTarget, setGdprTarget] = useState<Member | null>(null);
  const [importWarningOpen, setImportWarningOpen] = useState(false);
  const [hasPendingImport, setHasPendingImport] = useState(false);

  const membersKey = useTenantQueryKey([
    "members",
    search,
    page,
    quotaFilter,
    statusFilter,
    planFilter,
  ]);
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
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery<PaginatedResult<Member>>({
    queryKey: membersKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (quotaFilter) params.set("quotaStatus", quotaFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("quotaPlanId", planFilter);
      return api.get<PaginatedResult<Member>>(`/members?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const members = membersPage?.items ?? [];
  const isInitialLoad = isPending && !membersPage;
  const isPageTransition = isFetching && isPlaceholderData;

  function runImport(file: File, dryRun: boolean) {
    pendingImportFileRef.current = file;
    setHasPendingImport(true);
    importMembers.mutate(
      { file, dryRun, updateExisting },
      {
        onSuccess: (res) => {
          if (!res.dryRun) {
            pendingImportFileRef.current = null;
            setHasPendingImport(false);
            setImportWarningOpen(false);
            toast.success("Importação concluída");
          }
          setImportResult(res);
        },
      },
    );
  }

  function confirmRealImport() {
    const file = pendingImportFileRef.current;
    if (!file) return;
    importMembers.mutate(
      { file, dryRun: false, updateExisting },
      {
        onSuccess: (res) => {
          pendingImportFileRef.current = null;
          setHasPendingImport(false);
          setImportWarningOpen(false);
          setImportResult(res);
          toast.success("Importação concluída");
        },
      },
    );
  }

  function handleConfirmImport() {
    if (!importResult || !pendingImportFileRef.current) return;
    if (importResult.errors.length > 0) {
      setImportWarningOpen(true);
      return;
    }
    toast.info("A iniciar importação...");
    confirmRealImport();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>

      {!canManage && !roleLoading && <ConsultModeBanner />}

      {membersError && (
        <div className="mb-6">
          <QueryErrorCard onRetry={() => void refetchMembers()} />
        </div>
      )}

      <MembersToolsPanel
        canManage={canManage}
        canExportReports={canExportReports}
        updateExisting={updateExisting}
        importDryRun={importDryRun}
        importPending={importMembers.isPending}
        onUpdateExistingChange={setUpdateExisting}
        onImportDryRunChange={setImportDryRun}
        onImportClick={() => importInputRef.current?.click()}
      />

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

      {importResult && (
        <div className="mb-6">
          <ImportResultPanel
            result={importResult}
            isConfirming={importMembers.isPending}
            onDismiss={() => {
              setImportResult(null);
              pendingImportFileRef.current = null;
              setHasPendingImport(false);
            }}
            onConfirmImport={
              importResult.dryRun && hasPendingImport
                ? handleConfirmImport
                : undefined
            }
          />
        </div>
      )}

      {canManage && (
        <Card id="create-member-form" className="mb-6">
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                createMember.mutate(
                  { name, email, quotaPlanId, joinedAt },
                  {
                    onSuccess: () => {
                      setName("");
                      setEmail("");
                      setQuotaPlanId("");
                      setJoinedAt(todayDateInput());
                    },
                  },
                );
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do sócio"
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
              </div>
              <div className="w-44 space-y-1">
                <label className="text-sm font-medium">Plano</label>
                <select
                  value={quotaPlanId}
                  onChange={(e) => setQuotaPlanId(e.target.value)}
                  className={SELECT_CLASS}
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
                {createMember.isPending ? "A criar..." : "Adicionar sócio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar sócios..."
          />
        </div>
        {membersPage && membersPage.total > 0 && (
          <p className="text-sm text-muted-foreground">
            {membersPage.total} sócio{membersPage.total !== 1 ? "s" : ""}
            {isPageTransition ? " · A actualizar..." : ""}
          </p>
        )}
      </div>

      <MemberFilters
        quotaStatus={quotaFilter}
        memberStatus={statusFilter}
        planId={planFilter}
        plans={plans}
        onQuotaStatusChange={(value) => {
          setQuotaFilter(value);
          setPage(1);
        }}
        onMemberStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onPlanIdChange={(value) => {
          setPlanFilter(value);
          setPage(1);
        }}
        onClear={() => {
          setQuotaFilter("");
          setStatusFilter("");
          setPlanFilter("");
          setPage(1);
        }}
      />

      <MembersTable
        membersPage={membersPage}
        members={members}
        isInitialLoad={isInitialLoad}
        isPageTransition={isPageTransition}
        search={search}
        page={page}
        editingId={editingId}
        canManage={canManage}
        canAccessCards={canAccessCards}
        canManagePhotos={canManage}
        deletePending={deleteMember.isPending}
        grantPortalPending={grantPortal.isPending}
        uploadPhotoPending={uploadPhoto.isPending}
        emptyIcon={Users}
        onPageChange={setPage}
        onEdit={(m) => {
          setEditingId(m.id);
          setEditForm(memberToForm(m));
        }}
        onDelete={setDeleteTarget}
        onGrantPortal={(m) => {
          setPortalGrantMember(m);
          setPortalPassword("");
        }}
        onGdprErase={setGdprTarget}
        onUploadPhoto={(memberId, file) =>
          uploadPhoto.mutate({ memberId, file })
        }
        onImportClick={() => importInputRef.current?.click()}
        onCreateClick={() =>
          document
            .getElementById("create-member-form")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        onClearFilters={() => {
          setSearchInput("");
          setSearch("");
          setQuotaFilter("");
          setStatusFilter("");
          setPlanFilter("");
          setPage(1);
        }}
      />

      <MemberEditDialog
        open={editingId !== null}
        memberId={editingId}
        form={editForm}
        plans={plans}
        canManage={canManage}
        saving={updateMember.isPending}
        gdprErasing={gdprErase.isPending}
        onClose={() => setEditingId(null)}
        onChange={setEditForm}
        onSubmit={() => {
          if (!editingId) return;
          updateMember.mutate(
            { memberId: editingId, form: editForm },
            { onSuccess: () => setEditingId(null) },
          );
        }}
        onGdprErase={() => {
          const m = members.find((x) => x.id === editingId);
          if (m) setGdprTarget(m);
        }}
      />

      {portalGrantMember && (
        <PortalGrantDialog
          member={portalGrantMember}
          password={portalPassword}
          pending={grantPortal.isPending}
          onPasswordChange={setPortalPassword}
          onClose={() => {
            setPortalGrantMember(null);
            setPortalPassword("");
          }}
          onSubmit={() =>
            grantPortal.mutate(
              {
                memberId: portalGrantMember.id,
                password: portalPassword,
              },
              {
                onSuccess: () => {
                  setPortalGrantMember(null);
                  setPortalPassword("");
                },
              },
            )
          }
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Apagar sócio?"
        description={
          deleteTarget
            ? `Apagar "${deleteTarget.name}" (n.º ${deleteTarget.number})? Esta acção é irreversível.`
            : ""
        }
        confirmLabel="Apagar"
        variant="destructive"
        loading={deleteMember.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMember.mutate(deleteTarget.id, {
              onSuccess: () => {
                setEditingId(null);
                setDeleteTarget(null);
              },
            });
          }
        }}
      />

      <ConfirmDialog
        open={gdprTarget !== null}
        onOpenChange={(open) => {
          if (!open) setGdprTarget(null);
        }}
        title="Apagar dados pessoais (RGPD)?"
        description={
          gdprTarget
            ? `Apagar dados pessoais de "${gdprTarget.name}" (n.º ${gdprTarget.number})?\n\nO nome será anonimizado, contactos removidos e o acesso ao portal desativado. Os registos de pagamento mantêm-se para contabilidade. Esta acção é irreversível.`
            : ""
        }
        confirmLabel="Apagar dados (RGPD)"
        variant="destructive"
        loading={gdprErase.isPending}
        requireCheckbox
        checkboxLabel="Confirmo o apagamento definitivo"
        onConfirm={() => {
          if (gdprTarget) {
            gdprErase.mutate(gdprTarget.id, {
              onSuccess: () => {
                setEditingId(null);
                setGdprTarget(null);
              },
            });
          }
        }}
      />

      <ConfirmDialog
        open={importWarningOpen}
        onOpenChange={setImportWarningOpen}
        title="Importar com erros?"
        description={`A simulação encontrou ${importResult?.errors.length ?? 0} erro(s). Deseja importar mesmo assim? Linhas com erro serão ignoradas.`}
        confirmLabel="Importar mesmo assim"
        variant="destructive"
        loading={importMembers.isPending}
        onConfirm={() => confirmRealImport()}
      />
    </div>
  );
}
