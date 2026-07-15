"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MemberImportResult } from "@/lib/types";

interface ImportResultPanelProps {
  result: MemberImportResult;
  onDismiss: () => void;
  onConfirmImport?: () => void;
  isConfirming?: boolean;
}

export function ImportResultPanel({
  result,
  onDismiss,
  onConfirmImport,
  isConfirming,
}: ImportResultPanelProps) {
  const hasErrors = result.errors.length > 0;
  const isDryRun = result.dryRun === true;

  return (
    <Card className="border-primary/30" data-testid="import-result-panel">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          {hasErrors ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {isDryRun ? "Simulação concluída" : "Importação concluída"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Criados: {result.created} | Actualizados: {result.updated} |
              Pagamentos: {result.payments} | Ignorados: {result.skipped} |
              Erros: {result.errors.length}
            </p>
          </div>
        </div>

        {hasErrors && (
          <div className="rounded-md border bg-muted/30">
            <p className="border-b px-3 py-2 text-sm font-medium">
              Erros por linha
            </p>
            <ul className="max-h-48 overflow-y-auto text-sm">
              {result.errors.map((err) => (
                <li
                  key={`${err.row}-${err.message}`}
                  className="border-b px-3 py-2 last:border-0"
                >
                  <span className="font-medium">Linha {err.row}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {err.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onDismiss} disabled={isConfirming}>
            {isDryRun ? "Cancelar" : "Fechar"}
          </Button>
          {isDryRun && onConfirmImport && (
            <Button
              onClick={onConfirmImport}
              disabled={isConfirming}
              variant={hasErrors ? "destructive" : "default"}
              title={
                hasErrors ? "Importar mesmo com erros na simulação" : undefined
              }
            >
              {isConfirming
                ? "A importar..."
                : hasErrors
                  ? "Importar com avisos"
                  : "Importar a sério"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
