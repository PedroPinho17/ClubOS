"use client";

import { Building2 } from "lucide-react";
import { useOrgLogoBlob } from "@/hooks/use-org-logo-blob";
import { cn } from "@/lib/utils";

interface OrgBrandHeaderProps {
  name?: string | null;
  /** URL directa (ex.: presigned S3 no backoffice). */
  logoUrl?: string | null;
  /** Path API autenticado (ex.: /portal/organization/logo). */
  logoApiPath?: string | null;
  className?: string;
}

/** Cabecalho da sidebar com logotipo e nome da organizacao. */
export function OrgBrandHeader({
  name,
  logoUrl,
  logoApiPath,
  className,
}: OrgBrandHeaderProps) {
  const blobLogo = useOrgLogoBlob(logoApiPath);
  const resolvedLogo = blobLogo ?? logoUrl ?? null;
  const displayName = name?.trim() || "ClubOS";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {resolvedLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedLogo}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md border bg-background object-contain p-0.5"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
          <Building2 className="h-5 w-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold leading-tight">
          {displayName}
        </div>
      </div>
    </div>
  );
}
