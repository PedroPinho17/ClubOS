'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { redirectSocioFromAdmin } from '@/lib/auth-redirect';
import { NAV_ITEMS, filterNavItems } from '@/lib/nav';
import type { Organization } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OrgSwitcher } from '@/components/org-switcher';
import { OrgBrandHeader } from '@/components/org-brand-header';
import { OrgDocumentBranding } from '@/components/org-document-branding';
import { UserMenu } from '@/components/user-menu';
import { useActiveOrgId } from '@/hooks/use-active-org';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useTenantQueryKey } from '@/hooks/use-tenant-query-key';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, isLoading } = useRequireAuth({ redirectIf: redirectSocioFromAdmin });

  const activeOrgId = useActiveOrgId();
  const orgKey = useTenantQueryKey(['organization']);
  const modulesKey = useTenantQueryKey(['modules', 'enabled']);

  const { data: org } = useQuery<Organization>({
    queryKey: orgKey,
    queryFn: () => api.get<Organization>('/organization'),
    enabled: !!session && !!activeOrgId,
  });

  const { data: enabled } = useQuery<string[]>({
    queryKey: modulesKey,
    queryFn: () => api.get<string[]>('/modules/enabled'),
    enabled: !!session && !!activeOrgId,
  });

  if (isLoading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  const role = session.user?.role;
  const enabledSet = new Set(enabled ?? []);
  const visibleNav = filterNavItems(NAV_ITEMS, enabledSet, role);

  return (
    <div className="flex min-h-screen">
      <OrgDocumentBranding name={org?.name} logoUrl={org?.logoUrl} organizationId={org?.id} />
      <aside className="flex w-64 flex-col border-r bg-card">
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
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
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
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-card px-6">
          <UserMenu name={session.user?.name} email={session.user?.email} />
        </header>
        <main key={activeOrgId ?? 'org'} className="flex-1 overflow-auto bg-muted/20 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
