"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";

type InvitePasswordDialogProps = {
  email: string;
  password: string;
  onClose: () => void;
};

export function InvitePasswordDialog({
  email,
  password,
  onClose,
}: InvitePasswordDialogProps) {
  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copiada");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-password-title"
    >
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 id="invite-password-title" className="text-lg font-semibold">
              Convite enviado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Guarde a password temporária — só é mostrada uma vez.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Password temporária</p>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">
                {password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copiar password"
                onClick={() => void copyPassword()}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
