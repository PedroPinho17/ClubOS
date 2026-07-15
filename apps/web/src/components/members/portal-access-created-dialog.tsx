"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";

type PortalAccessCreatedDialogProps = {
  memberName: string;
  email: string;
  password: string;
  onClose: () => void;
};

function loginUrl(): string {
  if (typeof window === "undefined") return "/login";
  return `${window.location.origin}/login`;
}

function buildInstructions(
  memberName: string,
  email: string,
  password: string,
): string {
  const url = loginUrl();
  return [
    `Olá ${memberName},`,
    "",
    "Foi-lhe criado acesso ao portal do sócio no ClubOS.",
    "",
    `Entrar em: ${url}`,
    `Email: ${email}`,
    `Password inicial: ${password}`,
    "",
    "No primeiro acesso será pedido para definir uma nova password (mínimo 12 caracteres).",
    "",
    "Se tiver dificuldades, contacte a direção do clube.",
  ].join("\n");
}

/** Instruções copiáveis após criar acesso ao portal do sócio. */
export function PortalAccessCreatedDialog({
  memberName,
  email,
  password,
  onClose,
}: PortalAccessCreatedDialogProps) {
  const instructions = buildInstructions(memberName, email, password);

  async function copyText(value: string, okMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(okMessage);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-access-created-title"
    >
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2
              id="portal-access-created-title"
              className="text-lg font-semibold"
            >
              Acesso ao portal criado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie estas informações ao sócio. A password só é mostrada uma
              vez.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {email}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Password inicial</p>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
                {password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copiar password"
                onClick={() => void copyText(password, "Password copiada")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Mensagem para o sócio</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void copyText(instructions, "Instruções copiadas")
                }
              >
                <Copy className="h-4 w-4" />
                Copiar tudo
              </Button>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              {instructions}
            </pre>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
