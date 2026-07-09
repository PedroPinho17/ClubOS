"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import { postLoginPath } from "@/lib/auth-redirect";
import { authClient, changePassword, useSession } from "@/lib/auth-client";

const MIN_NEW_PASSWORD = 12;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { refetch } = useSession();
  const { session, isLoading } = useRequireAuth({
    enforcePasswordChange: false,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_NEW_PASSWORD) {
      setError(
        `A nova password deve ter pelo menos ${MIN_NEW_PASSWORD} caracteres.`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova password deve ser diferente da atual.");
      return;
    }

    setSaving(true);
    const res = await changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    if (res.error) {
      setSaving(false);
      setError(res.error.message ?? "Não foi possível alterar a password.");
      return;
    }

    await api.post("/me/complete-password-change");
    await refetch();
    const { data } = await authClient.getSession();
    setSaving(false);
    if (data) {
      router.replace(postLoginPath(data.user.role, false));
    } else {
      router.replace("/login");
    }
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Definir nova password</CardTitle>
          <CardDescription>
            Por segurança, deve alterar a password no primeiro acesso (mínimo{" "}
            {MIN_NEW_PASSWORD} caracteres).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-sm font-medium">
                Password atual
              </label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-sm font-medium">
                Nova password
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_NEW_PASSWORD}
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirmar nova password
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_NEW_PASSWORD}
                className="h-11"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="min-h-11 w-full" disabled={saving}>
              {saving ? "A guardar..." : "Guardar e continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
