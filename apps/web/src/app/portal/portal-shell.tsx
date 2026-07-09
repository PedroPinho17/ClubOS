"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrgBrandHeader } from "@/components/org-brand-header";
import { OrgDocumentBranding } from "@/components/org-document-branding";
import { UserMenu } from "@/components/user-menu";
import { api } from "@/lib/api";
import { redirectAdminFromPortal } from "@/lib/auth-redirect";
import {
  enrichPortalMeCache,
  PORTAL_ME_QUERY_KEY,
  resolvePortalBranding,
} from "@/lib/portal-branding";
import { readPortalCache } from "@/lib/portal-cache";
import type { PortalMe } from "@/lib/types";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useRequireAuth({
    redirectIf: redirectAdminFromPortal,
  });
  const [cachedMe] = useState<PortalMe | null>(
    () => enrichPortalMeCache(readPortalCache<PortalMe>()) ?? null,
  );

  const { data: portalMe } = useQuery<PortalMe>({
    queryKey: [...PORTAL_ME_QUERY_KEY],
    queryFn: () => api.get<PortalMe>("/portal/me"),
    enabled: !!session,
    staleTime: 0,
    placeholderData: cachedMe ?? undefined,
  });

  const branding = resolvePortalBranding(portalMe);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <OrgDocumentBranding
        name={branding.name}
        logoApiPath={branding.logoApiPath}
        logoUrl={branding.logoUrl}
        organizationId={branding.id}
      />
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <OrgBrandHeader
              name={branding.name}
              logoApiPath={branding.logoApiPath}
              logoUrl={branding.logoUrl}
            />
          </div>
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>
      <main className="mx-auto max-w-lg p-4 pb-8 sm:p-6">{children}</main>
    </div>
  );
}
