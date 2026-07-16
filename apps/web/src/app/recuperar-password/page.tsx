"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Pedido de reset por email (Better Auth + SMTP).
 * Se o SMTP não estiver configurado, o email fica em modo simulado (logs API)
 * e o fluxo manual abaixo continua disponível.
 */
export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

    const { error: reqError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo,
    });
    setLoading(false);

    if (reqError) {
      setError(
        reqError.message ??
          "Não foi possível enviar o email. Tente o fluxo manual abaixo.",
      );
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Recuperar password</CardTitle>
          <CardDescription>
            Peça um link por email ou use o fluxo manual com a administração do
            clube.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {sent ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="font-medium">Pedido enviado</p>
              <p className="mt-1 text-sm">
                Se existir uma conta com esse email, receberá um link para
                redefinir a password (válido 1 hora). Verifique também o spam.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="reset-email" className="text-sm font-medium">
                  Email da conta
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="min-h-11 w-full"
                disabled={loading}
              >
                {loading ? "A enviar..." : "Enviar link por email"}
              </Button>
            </form>
          )}

          <section className="space-y-2 border-t pt-4">
            <h2 className="font-semibold text-foreground">
              Sem email? Fluxo manual
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Sou sócio</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Contacte a direção ou secretaria do clube.</li>
                  <li>
                    Peça{" "}
                    <strong className="text-foreground">
                      Membros → Redefinir acesso
                    </strong>
                    .
                  </li>
                  <li>
                    Entre em /login com a password inicial e defina uma nova no
                    1.º acesso.
                  </li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Sou administrador ou tesoureiro
                </p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>
                    Peça a outro admin um novo convite em Definições → Equipa.
                  </li>
                  <li>
                    Se já tem sessão noutro dispositivo, altere a password em
                    Conta.
                  </li>
                </ol>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
            <Link
              href="/privacidade"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Privacidade
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
