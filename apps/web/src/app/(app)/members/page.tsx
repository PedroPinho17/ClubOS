"use client";

import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { ConsultModeBanner } from "@/components/consult-mode-banner";
import { QueryErrorCard } from "@/components/query-error-card";
import { ImportResultPanel } from "@/components/members/import-result-panel";
import { MemberEditDialog } from "@/components/members/member-edit-dialog";
import { MemberFilters } from "@/components/members/member-filters";
import { MembersTable } from "@/components/members/members-table";
import { MembersToolsPanel } from "@/components/members/members-tools-panel";
import {
  emptyEditForm,
  memberToForm,
  SELECT_CLASS,
} from "@/components/members/members-shared";
import { PortalAccessCreatedDialog } from "@/components/members/portal-access-created-dialog";
import { PortalGrantDialog } from "@/components/members/portal-grant-dialog";
import { RoleGate } from "@/components/role-gate";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { todayDateInput } from "@/lib/date-input";
import { STAFF_ROLES } from "@/lib/staff-roles";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useMemberImport } from "@/hooks/use-member-import";
import { useMembersList } from "@/hooks/use-members-list";
import { useMembersMutations } from "@/hooks/use-members-mutations";
import {
  canAccessCards as hasCardAccess,
  canExportReports as hasReportExport,
  canManageMembers,
} from "@/lib/permissions";
import type { Member } from "@/lib/types";

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

  const list = useMembersList();
  const importFlow = useMemberImport();

  const {
    createMember,
    updateMember,
    deleteMember,
    grantPortal,
    uploadPhoto,
    gdprErase,
  } = useMembersMutations();

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
  const [portalAccessCreated, setPortalAccessCreated] = useState<{
    memberName: string;
    email: string;
    password: string;
    reset: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [gdprTarget, setGdprTarget] = useState<Member | null>(null);

  const setFilterPage1 =
    <T,>(set: (v: T) => void) =>
    (value: T) => {
      set(value);
      list.setPage(1);
    };
  const clearMemberFilters = () => {
    list.setQuotaFilter("");
    list.setStatusFilter("");
    list.setPlanFilter("");
    list.setPage(1);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Membros</h1>

      {!canManage && !roleLoading && <ConsultModeBanner />}

      {list.membersError && (
        <div className="mb-6">
          <QueryErrorCard onRetry={() => void list.refetchMembers()} />
        </div>
      )}

      <MembersToolsPanel
        canManage={canManage}
        canExportReports={canExportReports}
        updateExisting={importFlow.updateExisting}
        importDryRun={importFlow.importDryRun}
        importPending={importFlow.importPending}
        onUpdateExistingChange={importFlow.setUpdateExisting}
        onImportDryRunChange={importFlow.setImportDryRun}
        onImportClick={importFlow.openFilePicker}
      />

      <input
        ref={importFlow.importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFlow.runImport(file, importFlow.importDryRun);
          e.target.value = "";
        }}
      />

      {importFlow.importResult && (
        <div className="mb-6">
          <ImportResultPanel
            result={importFlow.importResult}
            isConfirming={importFlow.importPending}
            onDismiss={importFlow.dismissResult}
            onConfirmImport={
              importFlow.importResult.dryRun && importFlow.hasPendingImport
                ? importFlow.handleConfirmImport
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
                  {(list.plans ?? [])
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
            value={list.searchInput}
            onChange={(e) => list.setSearchInput(e.target.value)}
            placeholder="Pesquisar sócios..."
          />
        </div>
        {list.membersPage && list.membersPage.total > 0 && (
          <p className="text-sm text-muted-foreground">
            {list.membersPage.total} sócio
            {list.membersPage.total !== 1 ? "s" : ""}
            {list.isPageTransition ? " · A atualizar..." : ""}
          </p>
        )}
      </div>

      <MemberFilters
        quotaStatus={list.quotaFilter}
        memberStatus={list.statusFilter}
        planId={list.planFilter}
        plans={list.plans}
        onQuotaStatusChange={setFilterPage1(list.setQuotaFilter)}
        onMemberStatusChange={setFilterPage1(list.setStatusFilter)}
        onPlanIdChange={setFilterPage1(list.setPlanFilter)}
        onClear={clearMemberFilters}
      />

      <MembersTable
        membersPage={list.membersPage}
        members={list.members}
        isInitialLoad={list.isInitialLoad}
        isPageTransition={list.isPageTransition}
        search={list.search}
        page={list.page}
        editingId={editingId}
        canManage={canManage}
        canAccessCards={canAccessCards}
        canManagePhotos={canManage}
        deletePending={deleteMember.isPending}
        grantPortalPending={grantPortal.isPending}
        uploadPhotoPending={uploadPhoto.isPending}
        emptyIcon={Users}
        onPageChange={list.setPage}
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
        onImportClick={importFlow.openFilePicker}
        onCreateClick={() =>
          document
            .getElementById("create-member-form")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        onClearFilters={list.clearFilters}
      />

      <MemberEditDialog
        open={editingId !== null}
        memberId={editingId}
        form={editForm}
        plans={list.plans}
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
          const m = list.members.find((x) => x.id === editingId);
          if (m) setGdprTarget(m);
        }}
      />

      {portalGrantMember && (
        <PortalGrantDialog
          member={portalGrantMember}
          password={portalPassword}
          pending={grantPortal.isPending}
          isReset={!!portalGrantMember.userId}
          onPasswordChange={setPortalPassword}
          onClose={() => {
            setPortalGrantMember(null);
            setPortalPassword("");
          }}
          onSubmit={() => {
            const member = portalGrantMember;
            const password = portalPassword;
            grantPortal.mutate(
              { memberId: member.id, password },
              {
                onSuccess: (res) => {
                  setPortalGrantMember(null);
                  setPortalPassword("");
                  setPortalAccessCreated({
                    memberName: member.name,
                    email: res.email,
                    password,
                    reset: !!member.userId,
                  });
                },
              },
            );
          }}
        />
      )}

      {portalAccessCreated && (
        <PortalAccessCreatedDialog
          memberName={portalAccessCreated.memberName}
          email={portalAccessCreated.email}
          password={portalAccessCreated.password}
          isReset={portalAccessCreated.reset}
          onClose={() => setPortalAccessCreated(null)}
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
          if (!deleteTarget) return;
          deleteMember.mutate(deleteTarget.id, {
            onSuccess: () => {
              setEditingId(null);
              setDeleteTarget(null);
            },
          });
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
          if (!gdprTarget) return;
          gdprErase.mutate(gdprTarget.id, {
            onSuccess: () => {
              setEditingId(null);
              setGdprTarget(null);
            },
          });
        }}
      />

      <ConfirmDialog
        open={importFlow.importWarningOpen}
        onOpenChange={importFlow.setImportWarningOpen}
        title="Importar com erros?"
        description={`A simulação encontrou ${importFlow.importResult?.errors.length ?? 0} erro(s). Deseja importar mesmo assim? Linhas com erro serão ignoradas.`}
        confirmLabel="Importar mesmo assim"
        variant="destructive"
        loading={importFlow.importPending}
        onConfirm={() => importFlow.confirmRealImport()}
      />
    </div>
  );
}
