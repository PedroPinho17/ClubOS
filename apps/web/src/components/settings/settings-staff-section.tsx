"use client";

import { UserPlus } from "lucide-react";
import { TableBodySkeleton } from "@/components/page-skeletons";
import { QueryErrorCard } from "@/components/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StaffRole, StaffUser } from "@/lib/types";
import { ROLE_BADGE, ROLE_LABEL, SELECT_CLASS } from "./settings-shared";

type SettingsStaffSectionProps = {
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: StaffRole;
  setInviteRole: (v: StaffRole) => void;
  canInviteAdminRole: boolean;
  invitePending: boolean;
  onInvite: () => void;
  staff: StaffUser[] | undefined;
  staffPending: boolean;
  staffError: boolean;
  onRetryStaff: () => void;
};

export function SettingsStaffSection({
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  canInviteAdminRole,
  invitePending,
  onInvite,
  staff,
  staffPending,
  staffError,
  onRetryStaff,
}: SettingsStaffSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="font-semibold">Equipa</h2>
        <p className="text-sm text-muted-foreground">
          Convide administradores ou tesoureiros para gerir o clube.
        </p>

        <form
          className="flex flex-wrap items-end gap-3 border-b pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteName.trim() && inviteEmail.trim()) onInvite();
          }}
        >
          <div className="min-w-[160px] flex-1 space-y-1">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="min-w-[180px] flex-1 space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.pt"
            />
          </div>
          <div className="w-44 space-y-1">
            <label className="text-sm font-medium">Função</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as StaffRole)}
              className={SELECT_CLASS}
            >
              <option value="tesoureiro">Tesoureiro</option>
              {canInviteAdminRole && (
                <option value="administrador">Administrador</option>
              )}
            </select>
          </div>
          <Button
            type="submit"
            disabled={
              invitePending || !inviteName.trim() || !inviteEmail.trim()
            }
          >
            <UserPlus className="h-4 w-4" />
            {invitePending ? "A convidar..." : "Convidar"}
          </Button>
        </form>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Nome</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Função</th>
            </tr>
          </thead>
          <tbody>
            {staffError ? (
              <tr>
                <td colSpan={3} className="py-4">
                  <QueryErrorCard onRetry={onRetryStaff} />
                </td>
              </tr>
            ) : staffPending && !staff ? (
              <TableBodySkeleton rows={3} cols={3} />
            ) : staff && staff.length > 0 ? (
              staff.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3">
                    <Badge variant={ROLE_BADGE[u.role ?? ""] ?? "secondary"}>
                      {ROLE_LABEL[u.role ?? ""] ?? u.role ?? "—"}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-muted-foreground">
                  Sem utilizadores na equipa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
