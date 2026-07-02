'use client';

import { useQuery } from '@tanstack/react-query';
import { KeyRound, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { passkey, signOut, useSession } from '@/lib/auth-client';
import { NAV_ITEMS } from '@/lib/nav';
import type { Organization } from '@/lib/types';
import { cn } from '@/lib/utils';

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

  const { data: org } = useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: () => api.get<Organization>('/organization'),
    enabled: !!session,
  });

  const { data: enabled } = useQuery<string[]>({
    queryKey: ['modules', 'enabled'],
    queryFn: () => api.get<string[]>('/modules/enabled'),
    enabled: !!session,
  });

  const enabledSet = new Set(enabled ?? []);
  const visibleNav = NAV_ITEMS.filter((item) => !item.module || enabledSet.has(item.module));

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

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="border-b p-4">
          <div className="text-xl font-bold text-primary">ClubOS</div>
          <div className="mt-1 truncate text-sm text-muted-foreground">{org?.name ?? '...'}</div>
        </div>
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
      <main className="flex-1 overflow-auto bg-muted/20 p-8">{children}</main>
    </div>
  );
}
