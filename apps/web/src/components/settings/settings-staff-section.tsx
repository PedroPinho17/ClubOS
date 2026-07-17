"use client";

import { UserPlus, Users } from "lucide-react";
import {
  MobileCardsSkeleton,
  TableBodySkeleton,
} from "@/components/page-skeletons";
import { QueryErrorCard } from "@/components/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
          id="invite-staff-form"
          className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteName.trim() && inviteEmail.trim()) onInvite();
          }}
        >
          <div className="min-w-0 flex-1 space-y-1 sm:min-w-[160px]">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="invite-name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:min-w-[180px]">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.pt"
            />
          </div>
          <div className="w-full space-y-1 sm:w-44">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Função
            </label>
            <select
              id="invite-role"
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
            className="min-h-11 w-full sm:w-auto"
            disabled={
              invitePending || !inviteName.trim() || !inviteEmail.trim()
            }
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {invitePending ? "A convidar..." : "Convidar"}
          </Button>
        </form>

        {staffError ? (
          <QueryErrorCard embedded onRetry={onRetryStaff} />
        ) : !staffPending && staff && staff.length === 0 ? (
          <EmptyState
            compact
            icon={Users}
            title="Sem utilizadores na equipa"
            description="Convide o primeiro administrador ou tesoureiro para ajudar a gerir o clube."
            actions={[
              {
                label: "Convidar membro",
                onClick: () =>
                  document
                    .getElementById("invite-staff-form")
                    ?.scrollIntoView({ behavior: "smooth" }),
              },
            ]}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Função</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPending && !staff ? (
                    <TableBodySkeleton rows={3} cols={3} />
                  ) : staff && staff.length > 0 ? (
                    staff.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{u.name}</td>
                        <td className="py-3 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={ROLE_BADGE[u.role ?? ""] ?? "secondary"}
                          >
                            {ROLE_LABEL[u.role ?? ""] ?? u.role ?? "—"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {staffPending && !staff ? (
                <MobileCardsSkeleton count={3} />
              ) : staff && staff.length > 0 ? (
                staff.map((u) => (
                  <div key={u.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{u.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                      <Badge variant={ROLE_BADGE[u.role ?? ""] ?? "secondary"}>
                        {ROLE_LABEL[u.role ?? ""] ?? u.role ?? "—"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
