"use client";

import { Button } from "@/components/ui/button";

type RoleContextErrorProps = {
  onRetry: () => void;
};

/** Erro ao carregar papel efectivo / contexto da org activa. */
export function RoleContextError({ onRetry }: RoleContextErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar as permissões desta organização.
      </p>
      <Button variant="outline" size="sm" onClick={() => onRetry()}>
        Tentar novamente
      </Button>
    </div>
  );
}
