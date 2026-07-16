"use client";

import { ImagePlus, Save } from "lucide-react";
import { QueryErrorCard } from "@/components/query-error-card";
import { SettingsOrgSkeleton } from "@/components/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/lib/types";

type SettingsBrandingFormProps = {
  org: Organization | undefined;
  orgError: boolean;
  onRetryOrg: () => void;
  name: string;
  setName: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  locale: string;
  setLocale: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  uploadLogoPending: boolean;
  onUploadLogo: (file: File) => void;
  savePending: boolean;
  onSave: () => void;
};

export function SettingsBrandingForm({
  org,
  orgError,
  onRetryOrg,
  name,
  setName,
  primaryColor,
  setPrimaryColor,
  locale,
  setLocale,
  timezone,
  setTimezone,
  uploadLogoPending,
  onUploadLogo,
  savePending,
  onSave,
}: SettingsBrandingFormProps) {
  const orgReady = !!org;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="font-semibold">Organização</h2>
        {orgError ? (
          <QueryErrorCard onRetry={onRetryOrg} />
        ) : !orgReady ? (
          <SettingsOrgSkeleton />
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              {org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="h-20 w-20 rounded-lg border object-contain p-1"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                  Sem logo
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                {uploadLogoPending ? "A enviar..." : "Logótipo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={uploadLogoPending}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadLogo(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <form
              className="grid flex-1 gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
            >
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cor principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-input"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug</label>
                <Input value={org.slug} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Idioma</label>
                <Input
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  placeholder="pt-PT"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fuso horário</label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Europe/Lisbon"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={savePending || !name.trim()}>
                  <Save className="h-4 w-4" />
                  {savePending ? "A guardar..." : "Guardar definições"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
