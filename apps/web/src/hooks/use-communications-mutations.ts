"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type {
  Communication,
  CommunicationAudience,
  WhatsappLink,
} from "@/lib/types";

type PreviewEmailInput = {
  subject: string;
  body: string;
};

type SendEmailInput = {
  subject: string;
  body: string;
  audience: CommunicationAudience;
  planId: string;
};

type GenerateWhatsappInput = {
  body: string;
  audience: CommunicationAudience;
  planId: string;
};

export function useCommunicationsMutations() {
  const queryClient = useQueryClient();

  const previewEmail = useMutation({
    mutationFn: (input: PreviewEmailInput) =>
      api.post<{ html: string; text: string; sampleName: string }>(
        "/communications/preview/email",
        {
          subject: input.subject,
          body: input.body,
        },
      ),
    onError: (err: Error) => toast.error(err.message),
  });

  const sendEmail = useMutation({
    mutationFn: (input: SendEmailInput) =>
      api.post<Communication>("/communications", {
        subject: input.subject,
        body: input.body,
        audience: input.audience,
        planId: input.audience === "PLAN" ? input.planId : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Email enviado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generateWhatsapp = useMutation({
    mutationFn: (input: GenerateWhatsappInput) =>
      api.post<{ links: WhatsappLink[] }>("/communications/whatsapp", {
        body: input.body,
        audience: input.audience,
        planId: input.audience === "PLAN" ? input.planId : undefined,
      }),
    onError: (err: Error) => toast.error(err.message),
  });

  return { previewEmail, sendEmail, generateWhatsapp };
}
