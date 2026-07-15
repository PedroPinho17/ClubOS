"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type QueryErrorCardProps = {
  message?: string;
  onRetry?: () => void;
};

/** Erro ao carregar dados — com opção de retry. */
export function QueryErrorCard({
  message = "Não foi possível carregar os dados. Verifique a ligação e tente novamente.",
  onRetry,
}: QueryErrorCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={() => void onRetry()}>
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
