"use client";

import { QueryErrorCard } from "@/components/query-error-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsRemindersSectionProps = {
  orgSettingsError: boolean;
  onRetryOrgSettings: () => void;
  orgSettingsPending: boolean;
  orgSettingsReady: boolean;
  diasAvisoQuota: number;
  setDiasAvisoQuota: (v: number) => void;
  lembretesAutomaticos: boolean;
  setLembretesAutomaticos: (v: boolean) => void;
  savePending: boolean;
  onSave: () => void;
};

export function SettingsRemindersSection({
  orgSettingsError,
  onRetryOrgSettings,
  orgSettingsPending,
  orgSettingsReady,
  diasAvisoQuota,
  setDiasAvisoQuota,
  lembretesAutomaticos,
  setLembretesAutomaticos,
  savePending,
  onSave,
}: SettingsRemindersSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="font-semibold">Lembretes de quota</h2>
        <p className="text-sm text-muted-foreground">
          Email automático aos sócios quando a quota está a vencer (nos próximos
          X dias) ou em atraso. Requer SMTP configurado e{" "}
          <code className="text-xs">REMINDERS_ENABLED=true</code> no servidor.
        </p>
        {orgSettingsError ? (
          <QueryErrorCard onRetry={onRetryOrgSettings} />
        ) : orgSettingsPending && !orgSettingsReady ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10 sm:col-span-2" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Dias de aviso antes do vencimento
              </label>
              <Input
                type="number"
                min={1}
                max={90}
                value={diasAvisoQuota}
                onChange={(e) => setDiasAvisoQuota(Number(e.target.value) || 7)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={lembretesAutomaticos}
                onChange={(e) => setLembretesAutomaticos(e.target.checked)}
              />
              Lembretes automáticos activos nesta organização
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" disabled={savePending}>
                {savePending ? "A guardar..." : "Guardar lembretes"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
