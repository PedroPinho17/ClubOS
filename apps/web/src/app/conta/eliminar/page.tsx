"use client";

import Link from "next/link";
import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export default function ContaEliminarPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground">
          Voltar ao login
        </Link>
      </p>

      <h1 className="mb-2 text-3xl font-bold">Eliminar conta</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Pedido de eliminacao de conta ClubOS (requisito App Store / Google
        Play). Apos autenticacao na app ou no portal, use Perfil → Eliminar
        conta. Esta pagina explica o processo publico.
      </p>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          1. Inicie sessao na app ClubOS ou em{" "}
          <Link href="/login" className="underline">
            /login
          </Link>
          .
        </p>
        <p>
          2. Em Perfil, escolha &quot;Eliminar conta&quot;. O pedido fica
          pendente e a associacao processa a anonimizacao (RGPD), mantendo
          registos de pagamento quando exigido por lei.
        </p>
        <p>
          3. API autenticada:{" "}
          <code className="rounded bg-muted px-1">
            POST {API_URL}/api/me/account-deletion
          </code>
        </p>
      </div>

      {!submitted ? (
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="block text-sm font-medium text-foreground">
            Email da conta (referencia)
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="socio@exemplo.pt"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          >
            Confirmar que li as instrucoes
          </button>
        </form>
      ) : (
        <p className="mt-8 rounded-md border p-4 text-sm">
          Obrigado. Inicie sessao e use Perfil → Eliminar conta para registar o
          pedido formal ({email}).
        </p>
      )}
    </div>
  );
}
