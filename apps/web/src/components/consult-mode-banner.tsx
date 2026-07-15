"use client";

import { Eye } from "lucide-react";

/** Aviso para utilizadores com acesso só de leitura (ex.: tesoureiro em membros). */
export function ConsultModeBanner() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <Eye className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-medium text-foreground">Modo consulta.</span> Pode
        ver a lista de sócios; alterações e exportações RGPD são só para
        administradores.
      </p>
    </div>
  );
}
