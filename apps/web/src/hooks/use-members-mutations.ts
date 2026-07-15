"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadFile } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Member, MemberImportResult } from "@/lib/types";
import type { MemberEditForm } from "@/components/members/member-edit-dialog";

type CreateMemberInput = {
  name: string;
  email: string;
  quotaPlanId: string;
  joinedAt: string;
};

export function useMembersMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["members"] });

  const createMember = useMutation({
    mutationFn: (input: CreateMemberInput) =>
      api.post<Member>("/members", {
        name: input.name,
        email: input.email || undefined,
        quotaPlanId: input.quotaPlanId || undefined,
        joinedAt: input.joinedAt,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Sócio criado com sucesso");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMember = useMutation({
    mutationFn: ({
      memberId,
      form,
    }: {
      memberId: string;
      form: MemberEditForm;
    }) =>
      api.patch<Member>(`/members/${memberId}`, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        status: form.status,
        quotaPlanId: form.quotaPlanId || null,
        cardRole: form.cardRole || undefined,
        notes: form.notes || undefined,
        joinedAt: form.joinedAt,
        cardValidUntil: form.cardValidUntil || null,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Alterações guardadas");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Sócio removido");
    },
    onError: (err: Error) => toast.error(err.message),
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
        { password },
      ),
    onSuccess: () => {
      invalidate();
      toast.success("Acesso ao portal criado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ memberId, file }: { memberId: string; file: File }) =>
      uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: () => {
      invalidate();
      toast.success("Fotografia atualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const importMembers = useMutation({
    mutationFn: ({
      file,
      dryRun,
      updateExisting,
    }: {
      file: File;
      dryRun: boolean;
      updateExisting: boolean;
    }) =>
      uploadFile<MemberImportResult>("/members/import", file, {
        updateExisting: updateExisting ? "true" : "false",
        dryRun: dryRun ? "true" : "false",
      }),
    onError: (err: Error) => toast.error(err.message),
  });

  const gdprErase = useMutation({
    mutationFn: (memberId: string) =>
      api.post(`/members/${memberId}/gdpr-erase`, { confirm: true }),
    onSuccess: () => {
      invalidate();
      toast.success("Dados pessoais apagados (RGPD)");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    createMember,
    updateMember,
    deleteMember,
    grantPortal,
    uploadPhoto,
    importMembers,
    gdprErase,
  };
}
