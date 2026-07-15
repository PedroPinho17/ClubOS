"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Recuperação de password documentada in-app.
 * Reset automático por email exige SMTP + Better Auth sendResetPassword —
 * até lá, o fluxo é manual e está descrito aqui para staff e sócios.
 */
export default function RecuperarPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Recuperar password</CardTitle>
          <CardDescription>
            O ClubOS ainda não envia email automático de reset. Use o fluxo
            abaixo conforme o seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <section className="space-y-2">
            <h2 className="font-semibold text-foreground">Sou sócio</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
              <li>
                Contacte a direção ou secretaria do seu clube (email ou telefone
                habituais).
              </li>
              <li>
                Peça para recriarem o acesso ao portal em{" "}
                <strong className="text-foreground">
                  Membros → Dar acesso
                </strong>
                .
              </li>
              <li>
                Com a password inicial, entre em{" "}
                <Link href="/login" className="underline hover:text-foreground">
                  /login
                </Link>{" "}
                e defina uma nova password no primeiro acesso (mín. 12
                caracteres).
              </li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-foreground">
              Sou administrador ou tesoureiro
            </h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
              <li>
                Peça a outro administrador (ou ao Imperador da plataforma) para
                o convidar de novo em{" "}
                <strong className="text-foreground">Definições → Equipa</strong>
                .
              </li>
              <li>
                Se já tem sessão noutro dispositivo, em Conta pode alterar a
                password enquanto estiver autenticado.
              </li>
              <li>
                Em caso de urgência, contacte o suporte da plataforma ClubOS.
              </li>
            </ol>
          </section>

          <section className="rounded-lg border bg-muted/30 p-3 text-muted-foreground">
            <p>
              <strong className="text-foreground">Nota:</strong> o reset por
              email automático será adicionado quando o SMTP estiver configurado
              em produção. Até lá, a recuperação é sempre via administração do
              clube.
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
            <Link
              href="/privacidade"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Política de privacidade
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
