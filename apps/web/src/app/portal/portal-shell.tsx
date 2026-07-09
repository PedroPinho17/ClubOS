"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrgBrandHeader } from "@/components/org-brand-header";
import { OrgDocumentBranding } from "@/components/org-document-branding";
import { UserMenu } from "@/components/user-menu";
import { api } from "@/lib/api";
import { redirectAdminFromPortal } from "@/lib/auth-redirect";
import { readPortalCache } from "@/lib/portal-cache";
import type { PortalMe } from "@/lib/types";
import { useRequireAuth } from "@/hooks/use-require-auth";

const PORTAL_LOGO_PATH = "/portal/organization/logo";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useRequireAuth({
    redirectIf: redirectAdminFromPortal,
  });
  const [cachedMe] = useState<PortalMe | null>(() =>
    readPortalCache<PortalMe>(),
  );

  const { data: portalMe } = useQuery<PortalMe>({
    queryKey: ["portal", "me"],
    queryFn: () => api.get<PortalMe>("/portal/me"),
    enabled: !!session,
    placeholderData: cachedMe ?? undefined,
  });

  const org = portalMe?.organization;
  const logoApiPath = org?.hasLogo ? PORTAL_LOGO_PATH : null;

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
        name={org?.name}
        logoApiPath={logoApiPath}
        organizationId={org?.id}
      />
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <OrgBrandHeader name={org?.name} logoApiPath={logoApiPath} />
          </div>
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>
      <main className="mx-auto max-w-lg p-4 pb-8 sm:p-6">{children}</main>
    </div>
  );
}
