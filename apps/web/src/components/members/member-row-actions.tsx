"use client";

import {
  FileDown,
  FileText,
  IdCard,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Member } from "@/lib/types";

interface MemberRowActionsProps {
  member: Member;
  canManage: boolean;
  canAccessCards: boolean;
  deletePending: boolean;
  grantPortalPending: boolean;
  isGdprErased: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGrantPortal: () => void;
  onExportGdpr: () => void;
  onGdprErase: () => void;
}

export function MemberRowActions({
  member,
  canManage,
  canAccessCards,
  deletePending,
  grantPortalPending,
  isGdprErased,
  onEdit,
  onDelete,
  onGrantPortal,
  onExportGdpr,
  onGdprErase,
}: MemberRowActionsProps) {
  const hasActions = canManage || canAccessCards;

  if (!hasActions) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (member.userId) {
    return (
      <div className="flex items-center justify-end gap-2">
        <RowActionsMenu
          member={member}
          canManage={canManage}
          canAccessCards={canAccessCards}
          deletePending={deletePending}
          grantPortalPending={grantPortalPending}
          isGdprErased={isGdprErased}
          hasPortal
          onEdit={onEdit}
          onDelete={onDelete}
          onGrantPortal={onGrantPortal}
          onExportGdpr={onExportGdpr}
          onGdprErase={onGdprErase}
        />
        <Badge variant="success">Portal</Badge>
      </div>
    );
  }

  if (member.email && !isGdprErased && canManage) {
    return (
      <div className="flex items-center justify-end gap-2">
        <RowActionsMenu
          member={member}
          canManage={canManage}
          canAccessCards={canAccessCards}
          deletePending={deletePending}
          grantPortalPending={grantPortalPending}
          isGdprErased={isGdprErased}
          hasPortal={false}
          onEdit={onEdit}
          onDelete={onDelete}
          onGrantPortal={onGrantPortal}
          onExportGdpr={onExportGdpr}
          onGdprErase={onGdprErase}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={grantPortalPending}
          onClick={onGrantPortal}
        >
          <UserCheck className="h-4 w-4" />
          Dar acesso
        </Button>
      </div>
    );
  }

  return (
    <RowActionsMenu
      member={member}
      canManage={canManage}
      canAccessCards={canAccessCards}
      deletePending={deletePending}
      grantPortalPending={grantPortalPending}
      isGdprErased={isGdprErased}
      hasPortal={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onGrantPortal={onGrantPortal}
      onExportGdpr={onExportGdpr}
      onGdprErase={onGdprErase}
    />
  );
}

function RowActionsMenu({
  member,
  canManage,
  canAccessCards,
  deletePending,
  grantPortalPending,
  isGdprErased,
  hasPortal,
  onEdit,
  onDelete,
  onGrantPortal,
  onExportGdpr,
  onGdprErase,
}: Omit<MemberRowActionsProps, "grantPortalPending"> & {
  grantPortalPending: boolean;
  hasPortal: boolean;
}) {
  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button variant="outline" size="sm" aria-label="Acções do sócio">
          <MoreHorizontal className="h-4 w-4" />
          Acções
        </Button>
      }
    >
      <DropdownMenuLabel>{member.name}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {canManage && (
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar sócio
        </DropdownMenuItem>
      )}
      {canManage && hasPortal && !isGdprErased && member.email && (
        <DropdownMenuItem disabled={grantPortalPending} onClick={onGrantPortal}>
          <KeyRound className="h-4 w-4" />
          Redefinir acesso
        </DropdownMenuItem>
      )}
      {canManage && !isGdprErased && (
        <DropdownMenuItem
          destructive
          disabled={deletePending}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Apagar sócio
        </DropdownMenuItem>
      )}
      {canAccessCards && !isGdprErased && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            href={`/cartao/${member.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IdCard className="h-4 w-4" />
            Ver cartão
          </DropdownMenuItem>
          <DropdownMenuItem
            href={`/cartao/${member.id}?pdf=1`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="h-4 w-4" />
            PDF do cartão
          </DropdownMenuItem>
        </>
      )}
      {canManage && !isGdprErased && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportGdpr}>
            <FileDown className="h-4 w-4" />
            Exportar RGPD
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={onGdprErase}>
            <ShieldAlert className="h-4 w-4" />
            Apagar dados RGPD…
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenu>
  );
}
