'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isAdminRole } from '@/lib/auth-redirect';
import { signOut, useSession } from '@/lib/auth-client';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace('/login');
    if (!isPending && session && isAdminRole(session.user.role)) router.replace('/dashboard');
  }, [isPending, session, router]);

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <div className="text-lg font-bold text-primary">Portal do Sócio</div>
            <div className="text-sm text-muted-foreground">{session.user.name}</div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
