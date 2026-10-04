"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

type HostOrgMismatchProps = {
  clubName?: string | null;
};

/** Conta autenticada que nao pertence ao clube deste dominio. */
export function HostOrgMismatch({ clubName }: HostOrgMismatchProps) {
  const router = useRouter();
  const label = clubName?.trim() || "este clube";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Conta sem acesso</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esta conta não pertence a {label}. Entra com uma conta deste clube ou
        acede pelo endereço correcto.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void signOut().then(() => {
              router.push("/login");
            })
          }
        >
          Terminar sessão
        </Button>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
