"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CommunicationsComposeForm } from "@/components/communications/communications-compose-form";
import { CommunicationsHistoryList } from "@/components/communications/communications-history-list";
import type { Channel } from "@/components/communications/communications-shared";
import { RoleGate } from "@/components/role-gate";
import { useCommunicationsMutations } from "@/hooks/use-communications-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type {
  Communication,
  CommunicationAudience,
  MembershipPlan,
  WhatsappLink,
} from "@/lib/types";

export default function CommunicationsPage() {
  return (
    <RoleGate roles={["imperador", "administrador"]}>
      <CommunicationsPageContent />
    </RoleGate>
  );
}

function CommunicationsPageContent() {
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<CommunicationAudience>("ACTIVE");
  const [planId, setPlanId] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsappLink[]>([]);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const communicationsKey = useTenantQueryKey(["communications"]);
  const plansKey = useTenantQueryKey(["membership-plans"]);

  const {
    data: list,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useQuery<Communication[]>({
    queryKey: communicationsKey,
    queryFn: () => api.get<Communication[]>("/communications"),
    refetchInterval: (query) => {
      const items = query.state.data;
      const hasActive = items?.some(
        (c) => c.status === "QUEUED" || c.status === "SENDING",
      );
      return hasActive ? 5000 : false;
    },
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
    enabled: audience === "PLAN",
  });

  useEffect(() => {
    const params = new URLSearchParams({ audience });
    if (audience === "PLAN" && planId) params.set("planId", planId);
    const previewPath =
      channel === "whatsapp"
        ? `/communications/preview/whatsapp?${params}`
        : `/communications/preview?${params}`;

    setPreviewCount(null);
    const timer = window.setTimeout(() => {
      api
        .get<{ count: number }>(previewPath)
        .then((r) => setPreviewCount(r.count))
        .catch((err: unknown) => {
          setPreviewCount(null);
          toast.error(
            err instanceof Error
              ? err.message
              : "Não foi possível calcular destinatários.",
          );
        });
    }, 300);

    setWhatsappLinks([]);
    setEmailPreviewHtml(null);
    return () => window.clearTimeout(timer);
  }, [audience, planId, channel]);

  const { previewEmail, sendEmail, generateWhatsapp } =
    useCommunicationsMutations();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Comunicações</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Email em massa (fila) ou links WhatsApp{" "}
        <code className="text-xs">wa.me</code> (semi-manual, um a um).
      </p>

      <CommunicationsComposeForm
        channel={channel}
        setChannel={setChannel}
        audience={audience}
        setAudience={setAudience}
        planId={planId}
        setPlanId={setPlanId}
        plans={plans}
        previewCount={previewCount}
        subject={subject}
        setSubject={setSubject}
        body={body}
        setBody={setBody}
        previewEmailPending={previewEmail.isPending}
        sendEmailPending={sendEmail.isPending}
        generateWhatsappPending={generateWhatsapp.isPending}
        onPreviewEmail={() =>
          previewEmail.mutate(
            { subject, body },
            {
              onSuccess: (res) => {
                setEmailPreviewHtml(res.html);
                setShowPreview(true);
              },
            },
          )
        }
        onSendEmail={() =>
          sendEmail.mutate(
            { subject, body, audience, planId },
            {
              onSuccess: () => {
                setSubject("");
                setBody("");
                setEmailPreviewHtml(null);
                setShowPreview(false);
              },
            },
          )
        }
        onGenerateWhatsapp={() =>
          generateWhatsapp.mutate(
            { body, audience, planId },
            { onSuccess: (res) => setWhatsappLinks(res.links) },
          )
        }
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        emailPreviewHtml={emailPreviewHtml}
        whatsappLinks={whatsappLinks}
      />

      <CommunicationsHistoryList
        list={list}
        listLoading={listLoading}
        listError={listError}
        onRetryList={() => void refetchList()}
      />
    </div>
  );
}
