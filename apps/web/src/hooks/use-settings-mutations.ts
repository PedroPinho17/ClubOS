"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadFile } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Organization, StaffRole } from "@/lib/types";

type SaveOrgInput = {
  name: string;
  primaryColor: string;
  locale: string;
  timezone: string;
};

type SaveRemindersInput = {
  diasAvisoQuota: number;
  lembretesAutomaticos: boolean;
};

type InviteUserInput = {
  name: string;
  email: string;
  role: StaffRole;
};

export function useSettingsMutations() {
  const queryClient = useQueryClient();

  const saveOrg = useMutation({
    mutationFn: (input: SaveOrgInput) =>
      api.patch<Organization>("/organization", {
        name: input.name.trim(),
        primaryColor: input.primaryColor,
        locale: input.locale,
        timezone: input.timezone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Definições guardadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveReminders = useMutation({
    mutationFn: async (input: SaveRemindersInput) => {
      await api.put("/organization/settings", {
        key: "dias_aviso_quota",
        value: input.diasAvisoQuota,
      });
      await api.put("/organization/settings", {
        key: "lembretes_automaticos",
        value: input.lembretesAutomaticos,
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
      toast.success("Logótipo atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteUser = useMutation({
    mutationFn: (input: InviteUserInput) =>
      api.post<{ email: string; tempPassword: string | null }>(
        "/users/invite",
        {
          name: input.name.trim(),
          email: input.email.trim(),
          role: input.role,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "staff"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { saveOrg, saveReminders, uploadLogo, inviteUser };
}
