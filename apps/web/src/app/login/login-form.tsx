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
import { useApiHealth } from "@/hooks/use-api-health";

const API_OFFLINE_MSG_DEV =
  "A API não está acessível (porta 4000). Corre `pnpm dev` na raiz do projeto e aguarda a mensagem «ClubOS API a correr».";

const API_OFFLINE_MSG =
  process.env.NODE_ENV === "development"
    ? API_OFFLINE_MSG_DEV
    : "Serviço temporariamente indisponível. Tente novamente dentro de momentos.";

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

export function LoginForm() {
  const router = useRouter();
  const { refetch } = useSession();
  const apiReachable = useApiHealth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (apiReachable === false) {
      setError(API_OFFLINE_MSG);
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Credenciais inválidas.");
        return;
      }
      const ok = await redirectAfterLogin(router, refetch);
      if (!ok) setError("Sessão não iniciada. Tente novamente.");
    } catch {
      setError(API_OFFLINE_MSG);
    } finally {
      setLoading(false);
    }
  }

  async function onPasskey() {
    setError(null);
    if (apiReachable === false) {
      setError(API_OFFLINE_MSG);
      return;
    }
    setLoading(true);
    try {
      const res = await signIn.passkey();
      if (res?.error) {
        setError(res.error.message ?? "Falha na autenticação com passkey.");
        return;
      }
      const ok = await redirectAfterLogin(router, refetch);
      if (!ok) setError("Sessão não iniciada. Tente novamente.");
    } catch {
      setError(API_OFFLINE_MSG);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 text-center text-2xl font-bold text-primary">
            ClubOS
          </div>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acede ao backoffice ou portal do sócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiReachable === false ? (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {API_OFFLINE_MSG}
            </p>
          ) : null}
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
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/recuperar-password"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Esqueci a password
                </Link>
              </div>
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

          <div className="mt-5 border-t pt-4">
            <button
              type="button"
              className="w-full text-left text-sm font-medium text-foreground"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((v) => !v)}
            >
              Problemas a entrar?
            </button>
            {helpOpen && (
              <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">Staff</strong> (admin /
                  tesoureiro) — abre o backoffice do clube após o login.
                </p>
                <p>
                  <strong className="text-foreground">Sócio</strong> — abre o
                  portal pessoal. O acesso é criado pela secretaria do clube; no
                  1.º login terá de definir uma nova password.
                </p>
                <p>
                  Sem password ou bloqueado?{" "}
                  <Link
                    href="/recuperar-password"
                    className="underline hover:text-foreground"
                  >
                    Ver como recuperar
                  </Link>{" "}
                  ou contacte a direção do clube.
                </p>
                <p>
                  <Link
                    href="/privacidade"
                    className="underline hover:text-foreground"
                  >
                    Política de privacidade
                  </Link>
                </p>
              </div>
            )}
          </div>
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
    </>
  );
}
