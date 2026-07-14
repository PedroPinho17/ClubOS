"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Member } from "@/lib/types";

type PortalGrantDialogProps = {
  member: Member;
  password: string;
  pending: boolean;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PortalGrantDialog({
  member,
  password,
  pending,
  onPasswordChange,
  onClose,
  onSubmit,
}: PortalGrantDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Acesso ao portal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {member.name} — {member.email}
            </p>
          </div>
          <div className="space-y-1">
            <label htmlFor="portal-password" className="text-sm font-medium">
              Password inicial
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
              {pending ? "A criar..." : "Criar acesso"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
