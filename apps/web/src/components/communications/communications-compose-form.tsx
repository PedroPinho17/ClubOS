"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CommunicationAudience,
  MembershipPlan,
  WhatsappLink,
} from "@/lib/types";
import {
  AUDIENCE_LABEL,
  SELECT_CLASS,
  type Channel,
} from "./communications-shared";

type CommunicationsComposeFormProps = {
  channel: Channel;
  setChannel: (c: Channel) => void;
  audience: CommunicationAudience;
  setAudience: (a: CommunicationAudience) => void;
  planId: string;
  setPlanId: (id: string) => void;
  plans: MembershipPlan[] | undefined;
  previewCount: number | null;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  previewEmailPending: boolean;
  sendEmailPending: boolean;
  generateWhatsappPending: boolean;
  onPreviewEmail: () => void;
  onSendEmail: () => void;
  onGenerateWhatsapp: () => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  emailPreviewHtml: string | null;
  whatsappLinks: WhatsappLink[];
};

export function CommunicationsComposeForm({
  channel,
  setChannel,
  audience,
  setAudience,
  planId,
  setPlanId,
  plans,
  previewCount,
  subject,
  setSubject,
  body,
  setBody,
  previewEmailPending,
  sendEmailPending,
  generateWhatsappPending,
  onPreviewEmail,
  onSendEmail,
  onGenerateWhatsapp,
  showPreview,
  setShowPreview,
  emailPreviewHtml,
  whatsappLinks,
}: CommunicationsComposeFormProps) {
  return (
    <Card className="mb-6">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={channel === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => setChannel("email")}
          >
            Email
          </Button>
          <Button
            type="button"
            variant={channel === "whatsapp" ? "default" : "outline"}
            size="sm"
            onClick={() => setChannel("whatsapp")}
          >
            WhatsApp
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Audiência</label>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as CommunicationAudience)
              }
              className={SELECT_CLASS}
            >
              {(Object.keys(AUDIENCE_LABEL) as CommunicationAudience[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {AUDIENCE_LABEL[k]}
                  </option>
                ),
              )}
            </select>
          </div>
          {audience === "PLAN" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Plano</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">—</option>
                {plans?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {previewCount !== null ? (
          <p className="text-sm text-muted-foreground">
            Destinatários: <strong>{previewCount}</strong>{" "}
            {channel === "email" ? "(com email)" : "(com telemóvel válido)"}
          </p>
        ) : (
          <Skeleton className="h-4 w-48" />
        )}

        {channel === "email" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Assunto</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Mensagem</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className={SELECT_CLASS}
          />
        </div>

        {channel === "email" ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={previewEmailPending || !subject.trim() || !body.trim()}
              onClick={onPreviewEmail}
            >
              {previewEmailPending ? "A gerar..." : "Pré-visualizar email"}
            </Button>
            <Button
              disabled={
                sendEmailPending ||
                !subject.trim() ||
                !body.trim() ||
                (audience === "PLAN" && !planId)
              }
              onClick={onSendEmail}
            >
              {sendEmailPending ? "A enviar..." : "Enviar email"}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            disabled={
              generateWhatsappPending ||
              !body.trim() ||
              (audience === "PLAN" && !planId)
            }
            onClick={onGenerateWhatsapp}
          >
            {generateWhatsappPending ? "A gerar..." : "Gerar links WhatsApp"}
          </Button>
        )}

        {showPreview && emailPreviewHtml && channel === "email" && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Pré-visualização do email</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Fechar
              </Button>
            </div>
            <div
              className="max-h-96 overflow-auto rounded-lg border bg-white p-4 text-sm text-slate-900 dark:bg-zinc-950 dark:text-zinc-100"
              dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
            />
          </div>
        )}

        {whatsappLinks.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">
              {whatsappLinks.length} link(s) — clique para abrir no WhatsApp
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {whatsappLinks.map((link) => (
                <li
                  key={`${link.phone}-${link.name}`}
                  className="flex items-center justify-between gap-2 rounded border p-2"
                >
                  <span>
                    {link.name}{" "}
                    <span className="text-muted-foreground">
                      ({link.phone})
                    </span>
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-700 hover:underline dark:text-green-400"
                  >
                    Abrir <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
