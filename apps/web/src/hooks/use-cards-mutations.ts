"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadFile } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { CardLayout, CardSettings } from "@/lib/types";

export function useCardsMutations(memberId: string) {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (layout: CardLayout | null) =>
      api.put<CardSettings>("/cards/settings", layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-settings"] });
      queryClient.invalidateQueries({ queryKey: ["card"] });
      toast.success("Layout guardado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadFile(`/members/${memberId}/photo`, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card", memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Foto atualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => uploadFile("/organization/logo", file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card"] });
      toast.success("Logótipo atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { save, uploadPhoto, uploadLogo };
}
