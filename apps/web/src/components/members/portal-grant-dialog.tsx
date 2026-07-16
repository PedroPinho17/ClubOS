"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import type { Member } from "@/lib/types";

type PortalGrantDialogProps = {
  member: Member;
  password: string;
  pending: boolean;
  /** Sócio já tinha portal — redefinir password. */
  isReset?: boolean;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PortalGrantDialog({
  member,
  password,
  pending,
  isReset = false,
  onPasswordChange,
  onClose,
  onSubmit,
}: PortalGrantDialogProps) {
  const a11y = useDialogA11y(true, onClose, "portal-grant-title");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...a11y}
    >
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 id="portal-grant-title" className="text-lg font-semibold">
              {isReset ? "Redefinir acesso ao portal" : "Acesso ao portal"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {member.name} — {member.email}
            </p>
          </div>
          <div className="space-y-1">
            <label htmlFor="portal-password" className="text-sm font-medium">
              {isReset ? "Nova password inicial" : "Password inicial"}
            </label>
            <Input
              id="portal-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              O sócio terá de alterar esta password no primeiro login (mín. 12
              caracteres).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={password.length < 8 || pending}
              onClick={onSubmit}
            >
              {pending
                ? "A guardar..."
                : isReset
                  ? "Redefinir acesso"
                  : "Criar acesso"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
