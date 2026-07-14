"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { redirectSocioFromAdmin } from "@/lib/auth-redirect";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OrgBrandHeader } from "@/components/org-brand-header";
import { OrgDocumentBranding } from "@/components/org-document-branding";
import { UserMenu } from "@/components/user-menu";
import { AppShellSkeleton } from "@/components/app-shell-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useBootstrapActiveOrganization } from "@/hooks/use-bootstrap-active-org";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";

const OrgSwitcher = dynamic(
  () => import("@/components/org-switcher").then((m) => m.OrgSwitcher),
  {
    loading: () => (
      <div className="p-2">
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    ssr: false,
  },
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, isLoading } = useRequireAuth({
    redirectIf: redirectSocioFromAdmin,
  });

  const activeOrgId = useActiveOrgId();
  const { isBootstrapping } = useBootstrapActiveOrganization(!!session);
  const { effectiveRole, isLoading: roleLoading } = useEffectiveRole();
  const orgKey = useTenantQueryKey(["organization"]);
  const modulesKey = useTenantQueryKey(["modules", "enabled"]);

  const { data: org } = useQuery<Organization>({
    queryKey: orgKey,
    queryFn: () => api.get<Organization>("/organization"),
    enabled: !!session && !!activeOrgId,
  });

  const { data: enabled } = useQuery<string[]>({
    queryKey: modulesKey,
    queryFn: () => api.get<string[]>("/modules/enabled"),
    enabled: !!session && !!activeOrgId,
  });

  if (isLoading || !session || isBootstrapping || roleLoading) {
    return <AppShellSkeleton />;
  }

  const role = effectiveRole ?? session.user?.role;
  const enabledSet = new Set(enabled ?? []);
  const visibleNav = filterNavItems(NAV_ITEMS, enabledSet, role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <OrgDocumentBranding
        name={org?.name}
        logoUrl={org?.logoUrl}
        organizationId={org?.id}
      />
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="border-b p-4">
          <OrgBrandHeader name={org?.name} logoUrl={org?.logoUrl} />
        </div>
        <OrgSwitcher />
        <nav className="flex-1 space-y-1 p-2">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 md:justify-end md:px-6">
          <div className="min-w-0 md:hidden">
            <OrgBrandHeader name={org?.name} logoUrl={org?.logoUrl} />
          </div>
          <UserMenu name={session.user?.name} email={session.user?.email} />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main
          key={activeOrgId ?? "org"}
          className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 md:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
