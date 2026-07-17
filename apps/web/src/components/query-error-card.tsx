"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QueryErrorCardProps = {
  message?: string;
  onRetry?: () => void;
  /**
   * Sem Card exterior — usar dentro de um Card/secção já existente
   * (evita cartão dentro de cartão).
   */
  embedded?: boolean;
  className?: string;
};

/** Erro ao carregar dados — com opção de retry. */
export function QueryErrorCard({
  message = "Não foi possível carregar os dados. Verifique a ligação e tente novamente.",
  onRetry,
  embedded = false,
  className,
}: QueryErrorCardProps) {
  const body = (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center gap-3 text-center",
        embedded ? "py-6" : "py-10",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => void onRetry()}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Card>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
}
