"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { InvitePasswordDialog } from "@/components/invite-password-dialog";
import { SettingsBrandingForm } from "@/components/settings/settings-branding-form";
import { SettingsRemindersSection } from "@/components/settings/settings-reminders-section";
import { SettingsStaffSection } from "@/components/settings/settings-staff-section";
import { RoleGate } from "@/components/role-gate";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useSettingsMutations } from "@/hooks/use-settings-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import { canInviteAdmin } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import type { Organization, StaffRole, StaffUser } from "@/lib/types";

export default function SettingsPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <SettingsPageContent />
    </RoleGate>
  );
}

function SettingsPageContent() {
  const { effectiveRole } = useEffectiveRole();
  const canInviteAdminRole = canInviteAdmin(effectiveRole);

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [locale, setLocale] = useState("pt-PT");
  const [timezone, setTimezone] = useState("Europe/Lisbon");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("tesoureiro");
  const [invitePasswordDialog, setInvitePasswordDialog] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const orgKey = useTenantQueryKey(["organization"]);
  const orgSettingsKey = useTenantQueryKey(["organization", "settings"]);
  const staffKey = useTenantQueryKey(["users", "staff"]);

  const {
    data: org,
    isError: orgError,
    refetch: refetchOrg,
  } = useQuery<Organization>({
    queryKey: orgKey,
    queryFn: () => api.get<Organization>("/organization"),
    staleTime: 2 * 60_000,
  });

  const {
    data: orgSettings,
    isPending: orgSettingsPending,
    isError: orgSettingsError,
    refetch: refetchOrgSettings,
  } = useQuery<Record<string, unknown>>({
    queryKey: orgSettingsKey,
    queryFn: () => api.get<Record<string, unknown>>("/organization/settings"),
    staleTime: 2 * 60_000,
  });

  const [diasAvisoQuota, setDiasAvisoQuota] = useState(7);
  const [lembretesAutomaticos, setLembretesAutomaticos] = useState(false);

  const {
    data: staff,
    isPending: staffPending,
    isError: staffError,
    refetch: refetchStaff,
  } = useQuery<StaffUser[]>({
    queryKey: staffKey,
    queryFn: () => api.get<StaffUser[]>("/users"),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (org) {
      setName(org.name);
      setPrimaryColor(org.primaryColor);
      setLocale(org.locale ?? "pt-PT");
      setTimezone(org.timezone ?? "Europe/Lisbon");
    }
  }, [org]);

  useEffect(() => {
    if (orgSettings) {
      const dias = Number(orgSettings.dias_aviso_quota);
      setDiasAvisoQuota(Number.isFinite(dias) && dias > 0 ? dias : 7);
      setLembretesAutomaticos(orgSettings.lembretes_automaticos === true);
    }
  }, [orgSettings]);

  const { saveOrg, saveReminders, uploadLogo, inviteUser } =
    useSettingsMutations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Definições</h1>
        <p className="text-sm text-muted-foreground">
          Organização, branding e equipa administrativa.
        </p>
      </div>

      <SettingsBrandingForm
        org={org}
        orgError={orgError}
        onRetryOrg={() => void refetchOrg()}
        name={name}
        setName={setName}
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
        locale={locale}
        setLocale={setLocale}
        timezone={timezone}
        setTimezone={setTimezone}
        uploadLogoPending={uploadLogo.isPending}
        onUploadLogo={(file) => uploadLogo.mutate(file)}
        savePending={saveOrg.isPending}
        onSave={() => saveOrg.mutate({ name, primaryColor, locale, timezone })}
      />

      <SettingsRemindersSection
        orgSettingsError={orgSettingsError}
        onRetryOrgSettings={() => void refetchOrgSettings()}
        orgSettingsPending={orgSettingsPending}
        orgSettingsReady={!!orgSettings}
        diasAvisoQuota={diasAvisoQuota}
        setDiasAvisoQuota={setDiasAvisoQuota}
        lembretesAutomaticos={lembretesAutomaticos}
        setLembretesAutomaticos={setLembretesAutomaticos}
        savePending={saveReminders.isPending}
        onSave={() =>
          saveReminders.mutate({ diasAvisoQuota, lembretesAutomaticos })
        }
      />

      <SettingsStaffSection
        inviteName={inviteName}
        setInviteName={setInviteName}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        canInviteAdminRole={canInviteAdminRole}
        invitePending={inviteUser.isPending}
        onInvite={() =>
          inviteUser.mutate(
            { name: inviteName, email: inviteEmail, role: inviteRole },
            {
              onSuccess: (res) => {
                setInviteName("");
                setInviteEmail("");
                setInviteRole("tesoureiro");
                if (res.tempPassword) {
                  setInvitePasswordDialog({
                    email: res.email,
                    password: res.tempPassword,
                  });
                } else {
                  toast.success(
                    "Convite enviado",
                    `${res.email} pode entrar com a password actual.`,
                  );
                }
              },
            },
          )
        }
        staff={staff}
        staffPending={staffPending}
        staffError={staffError}
        onRetryStaff={() => void refetchStaff()}
      />

      {invitePasswordDialog && (
        <InvitePasswordDialog
          email={invitePasswordDialog.email}
          password={invitePasswordDialog.password}
          onClose={() => setInvitePasswordDialog(null)}
        />
      )}
    </div>
  );
}
