"use client";

import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Wrench,
} from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadBlob } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MembersToolsPanelProps {
  canManage: boolean;
  canExportReports: boolean;
  updateExisting: boolean;
  importDryRun: boolean;
  importPending: boolean;
  onUpdateExistingChange: (value: boolean) => void;
  onImportDryRunChange: (value: boolean) => void;
  onImportClick: () => void;
}

export function MembersToolsPanel({
  canManage,
  canExportReports,
  updateExisting,
  importDryRun,
  importPending,
  onUpdateExistingChange,
  onImportDryRunChange,
  onImportClick,
}: MembersToolsPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!canManage && !canExportReports) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Ferramentas</h2>
              <p className="text-sm text-muted-foreground">
                Relatórios, importação e exportação Excel
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div id={panelId} className="space-y-6 border-t px-6 pb-6 pt-4">
            {canExportReports && (
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Relatórios de quota</h3>
                  <p className="text-sm text-muted-foreground">
                    Exportar sócios pagantes (em dia) ou em atraso — PDF ou
                    Excel (CSV).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/reports/members/paying.pdf",
                        "socios_pagantes.pdf",
                      )
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Pagantes PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/reports/members/paying.csv",
                        "socios_pagantes.csv",
                      )
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Pagantes Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/reports/members/overdue.pdf",
                        "socios_em_atraso.pdf",
                      )
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Em atraso PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadBlob(
                        "/reports/members/overdue.csv",
                        "socios_em_atraso.csv",
                      )
                    }
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Em atraso Excel
                  </Button>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Importar / Exportar</h3>
                  <p className="text-sm text-muted-foreground">
                    Excel (.xlsx) com o mesmo modelo do gestao_socios — sócios e
                    pagamentos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canExportReports && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void downloadBlob(
                          "/members/export",
                          "socios_exportacao.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar todos
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void downloadBlob(
                          "/members/import/template",
                          "modelo_importacao_socios.xlsx",
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                      Modelo Excel
                    </Button>
                  )}
                </div>
              </div>

              {canManage && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={importDryRun}
                      onChange={(e) => onImportDryRunChange(e.target.checked)}
                    />
                    Simular importação (sem gravar)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => onUpdateExistingChange(e.target.checked)}
                    />
                    Actualizar sócios existentes pelo número
                  </label>
                  <Button
                    variant="secondary"
                    disabled={importPending}
                    onClick={onImportClick}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {importPending
                      ? importDryRun
                        ? "A simular..."
                        : "A importar..."
                      : importDryRun
                        ? "Simular importação"
                        : "Importar Excel"}
                  </Button>
                </>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
