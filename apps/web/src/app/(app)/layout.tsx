'use client';

import { useQuery } from '@tanstack/react-query';
import { KeyRound, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { passkey, signOut, useSession } from '@/lib/auth-client';
import { NAV_ITEMS, filterNavItems } from '@/lib/nav';
import type { Organization } from '@/lib/types';
import { cn } from '@/lib/utils';
import { OrgSwitcher } from '@/components/org-switcher';
import { OrgBrandHeader } from '@/components/org-brand-header';
import { OrgDocumentBranding } from '@/components/org-document-branding';
import { useActiveOrgId } from '@/hooks/use-active-org';
import { useTenantQueryKey } from '@/hooks/use-tenant-query-key';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
      return;
    }
    if (!isPending && session && session.user.role === 'socio') {
      router.replace('/portal');
    }
  }, [isPending, session, router]);

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

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  async function addPasskey() {
    await passkey.addPasskey({ name: `${session?.user?.name ?? 'passkey'}` });
    alert('Passkey registada com sucesso.');
  }

  if (isPending || !session) {
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
        <div className="border-t p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium">{session.user?.name}</div>
            <div className="truncate text-xs text-muted-foreground">{session.user?.email}</div>
          </div>
          <button
            onClick={addPasskey}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <KeyRound className="h-4 w-4" />
            Adicionar passkey
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
      <main key={activeOrgId ?? 'org'} className="flex-1 overflow-auto bg-muted/20 p-8">
        {children}
      </main>
    </div>
  );
}
