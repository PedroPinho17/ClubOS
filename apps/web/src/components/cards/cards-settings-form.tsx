"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryErrorCard } from "@/components/query-error-card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CardLayout,
  CardSettings,
  CardTemplate,
  QrContent,
} from "@/lib/types";

const FIELD_TOGGLES: { key: keyof CardLayout; label: string }[] = [
  { key: "showNome", label: "Nome" },
  { key: "showNumero", label: "Número" },
  { key: "showFoto", label: "Foto" },
  { key: "showCargo", label: "Cargo" },
  { key: "showValidade", label: "Validade" },
  { key: "showPlano", label: "Plano" },
  { key: "showEmail", label: "Email" },
  { key: "showTelefone", label: "Telefone" },
];

type CardsSettingsFormProps = {
  layout: CardLayout | null;
  settings: CardSettings | undefined;
  settingsLoading: boolean;
  settingsError: boolean;
  onRetrySettings: () => void;
  isImperadorRole: boolean;
  savePending: boolean;
  onSave: () => void;
  set: <K extends keyof CardLayout>(key: K, value: CardLayout[K]) => void;
};

export function CardsSettingsForm({
  layout,
  settings,
  settingsLoading,
  settingsError,
  onRetrySettings,
  isImperadorRole,
  savePending,
  onSave,
  set,
}: CardsSettingsFormProps) {
  const settingsReady = !!layout;
  const availableTemplates = (settings?.catalog ?? []).filter(
    (t) => t.key !== "crc_vale" || layout?.crcValeEnabled,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          {settingsError ? (
            <QueryErrorCard embedded onRetry={onRetrySettings} />
          ) : !settingsReady ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <Skeleton className="h-40" />
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">Modelo ativo</label>
                  {isImperadorRole ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={layout.crcValeEnabled}
                        onChange={(e) =>
                          set("crcValeEnabled", e.target.checked)
                        }
                      />
                      Ativar layout CRC Vale
                    </label>
                  ) : layout.crcValeEnabled ? (
                    <span className="text-xs text-muted-foreground">
                      Layout CRC Vale ativado pela plataforma
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {availableTemplates.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => set("template", t.key as CardTemplate)}
                      className={`rounded-md border p-2 text-left text-sm transition-colors ${
                        layout.template === t.key
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Gradiente (início)"
                  value={layout.gradientFrom}
                  onChange={(v) => set("gradientFrom", v)}
                />
                <ColorField
                  label="Gradiente (fim)"
                  value={layout.gradientTo}
                  onChange={(v) => set("gradientTo", v)}
                />
                <ColorField
                  label="Cor de destaque"
                  value={layout.accentColor}
                  onChange={(v) => set("accentColor", v)}
                />
                <ColorField
                  label="Cor do texto"
                  value={layout.textColor}
                  onChange={(v) => set("textColor", v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Título (rótulo)"
                  value={layout.cardTitle}
                  onChange={(v) => set("cardTitle", v)}
                />
                <TextField
                  label="Prefixo do número"
                  value={layout.numeroPrefix}
                  onChange={(v) => set("numeroPrefix", v)}
                />
                <TextField
                  label="Rodapé"
                  value={layout.footerText}
                  onChange={(v) => set("footerText", v)}
                />
                <TextField
                  label="Slogan (CRC Vale)"
                  value={layout.slogan}
                  onChange={(v) => set("slogan", v)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo do QR</label>
                <select
                  value={layout.qrContent}
                  onChange={(e) =>
                    set("qrContent", e.target.value as QrContent)
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="validacao">URL de validação</option>
                  <option value="numero">Número do sócio</option>
                  <option value="dados">Dados (JSON)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Campos visíveis
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FIELD_TOGGLES.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(layout[f.key])}
                        onChange={(e) => set(f.key, e.target.checked as never)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={onSave}
                  disabled={savePending || !layout || settingsLoading}
                >
                  <Save className="h-4 w-4" />
                  {savePending ? "A guardar..." : "Guardar definições"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-input"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9"
      />
    </div>
  );
}
