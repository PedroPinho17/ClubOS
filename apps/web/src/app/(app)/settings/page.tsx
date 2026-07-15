"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, uploadFile } from "@/lib/api";
import { InvitePasswordDialog } from "@/components/invite-password-dialog";
import { RoleGate } from "@/components/role-gate";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { canInviteAdmin } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import type { Organization, StaffRole, StaffUser } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  imperador: "Imperador",
  administrador: "Administrador",
  tesoureiro: "Tesoureiro",
};

const ROLE_BADGE: Record<string, "default" | "secondary" | "success"> = {
  imperador: "default",
  administrador: "success",
  tesoureiro: "secondary",
};

export default function SettingsPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <SettingsPageContent />
    </RoleGate>
  );
}

function SettingsPageContent() {
  const queryClient = useQueryClient();
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

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: orgKey,
    queryFn: () => api.get<Organization>("/organization"),
  });

  const { data: orgSettings } = useQuery<Record<string, unknown>>({
    queryKey: orgSettingsKey,
    queryFn: () => api.get<Record<string, unknown>>("/organization/settings"),
  });

  const [diasAvisoQuota, setDiasAvisoQuota] = useState(7);
  const [lembretesAutomaticos, setLembretesAutomaticos] = useState(false);

  const { data: staff, isLoading: staffLoading } = useQuery<StaffUser[]>({
    queryKey: staffKey,
    queryFn: () => api.get<StaffUser[]>("/users"),
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

  const saveOrg = useMutation({
    mutationFn: () =>
      api.patch<Organization>("/organization", {
        name: name.trim(),
        primaryColor,
        locale,
        timezone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Definições guardadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveReminders = useMutation({
    mutationFn: async () => {
      await api.put("/organization/settings", {
        key: "dias_aviso_quota",
        value: diasAvisoQuota,
      });
      await api.put("/organization/settings", {
        key: "lembretes_automaticos",
        value: lembretesAutomaticos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "settings"] });
      toast.success("Definições de lembretes guardadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) =>
      uploadFile<Organization>("/organization/logo", file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Logótipo actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteUser = useMutation({
    mutationFn: () =>
      api.post<{ email: string; tempPassword: string | null }>(
        "/users/invite",
        {
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      ),
    onSuccess: (res) => {
      setInviteName("");
      setInviteEmail("");
      setInviteRole("tesoureiro");
      queryClient.invalidateQueries({ queryKey: ["users", "staff"] });
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
    onError: (err: Error) => toast.error(err.message),
  });

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (isLoading || !org) {
    return <p className="text-muted-foreground">A carregar...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Definições</h1>
        <p className="text-sm text-muted-foreground">
          Organização, branding e equipa administrativa.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">Organização</h2>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              {org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="h-20 w-20 rounded-lg border object-contain p-1"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                  Sem logo
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                {uploadLogo.isPending ? "A enviar..." : "Logótipo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={uploadLogo.isPending}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo.mutate(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <form
              className="grid flex-1 gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveOrg.mutate();
              }}
            >
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cor principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-input"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug</label>
                <Input value={org.slug} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Idioma</label>
                <Input
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  placeholder="pt-PT"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fuso horário</label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Europe/Lisbon"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={saveOrg.isPending || !name.trim()}
                >
                  <Save className="h-4 w-4" />
                  {saveOrg.isPending ? "A guardar..." : "Guardar definições"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">Lembretes de quota</h2>
          <p className="text-sm text-muted-foreground">
            Email automático aos sócios quando a quota está a vencer (nos
            próximos X dias) ou em atraso. Requer SMTP configurado e{" "}
            <code className="text-xs">REMINDERS_ENABLED=true</code> no servidor.
          </p>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveReminders.mutate();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Dias de aviso antes do vencimento
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={diasAvisoQuota}
                onChange={(e) => setDiasAvisoQuota(Number(e.target.value) || 7)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={lembretesAutomaticos}
                onChange={(e) => setLembretesAutomaticos(e.target.checked)}
              />
              Lembretes automáticos activos nesta organização
            </label>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={saveReminders.isPending}
              >
                {saveReminders.isPending ? "A guardar..." : "Guardar lembretes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              if (inviteName.trim() && inviteEmail.trim()) inviteUser.mutate();
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
                className={selectClass}
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
                inviteUser.isPending ||
                !inviteName.trim() ||
                !inviteEmail.trim()
              }
            >
              <UserPlus className="h-4 w-4" />
              {inviteUser.isPending ? "A convidar..." : "Convidar"}
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
              {staffLoading ? (
                <tr>
                  <td colSpan={3} className="py-4 text-muted-foreground">
                    A carregar...
                  </td>
                </tr>
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
