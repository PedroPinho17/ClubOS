"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "INVALID_TOKEN" ? "Link inválido ou expirado." : null,
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Link inválido. Peça um novo email de recuperação.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`A password deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }

    setSaving(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setSaving(false);

    if (resetError) {
      setError(resetError.message ?? "Não foi possível redefinir a password.");
      return;
    }
    setDone(true);
  }

  if (!token && !errorParam) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Link em falta</CardTitle>
          <CardDescription>
            Abra o link que recebeu por email, ou peça um novo reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.replace("/recuperar-password")}
          >
            Pedir novo link
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Password atualizada</CardTitle>
          <CardDescription>Já pode entrar com a nova password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.replace("/login")}>
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Nova password</CardTitle>
        <CardDescription>
          Defina uma password com pelo menos {MIN_PASSWORD} caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium">
              Nova password
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirmar
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={MIN_PASSWORD}
              className="h-11"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="min-h-11 w-full" disabled={saving}>
            {saving ? "A guardar..." : "Guardar password"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">A carregar...</p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
