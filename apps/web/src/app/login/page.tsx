"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
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
import { postLoginPath } from "@/lib/auth-redirect";
import { authClient, signIn, useSession } from "@/lib/auth-client";

async function redirectAfterLogin(
  router: ReturnType<typeof useRouter>,
  refetch: () => Promise<void>,
) {
  await refetch();
  const { data } = await authClient.getSession();
  if (!data) return false;
  const user = data.user as {
    role?: string | null;
    mustChangePassword?: boolean | null;
  };
  router.replace(postLoginPath(user.role, user.mustChangePassword));
  return true;
}

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message ?? "Credenciais invalidas.");
      return;
    }
    const ok = await redirectAfterLogin(router, refetch);
    if (!ok) setError("Sessao nao iniciada. Tenta novamente.");
    setLoading(false);
  }

  async function onPasskey() {
    setError(null);
    setLoading(true);
    const res = await signIn.passkey();
    if (res?.error) {
      setLoading(false);
      setError(res.error.message ?? "Falha na autenticacao com passkey.");
      return;
    }
    const ok = await redirectAfterLogin(router, refetch);
    if (!ok) setError("Sessao nao iniciada. Tenta novamente.");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 text-2xl font-bold text-primary">ClubOS</div>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acede ao backoffice ou portal do sócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                className="h-11 text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="min-h-11 w-full text-base"
              disabled={loading}
            >
              {loading ? "A entrar..." : "Entrar"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full text-base"
            onClick={onPasskey}
            disabled={loading}
          >
            <KeyRound className="h-4 w-4" />
            Entrar com passkey
          </Button>
        </CardContent>
      </Card>
      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        <Link
          href="/privacidade"
          className="inline-block py-2 underline hover:text-foreground"
        >
          Política de privacidade
        </Link>
        {" · "}
        <Link
          href="/dpa"
          className="inline-block py-2 underline hover:text-foreground"
        >
          DPA
        </Link>
      </p>
    </div>
  );
}
