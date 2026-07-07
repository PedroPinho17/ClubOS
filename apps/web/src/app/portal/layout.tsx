'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OrgBrandHeader } from '@/components/org-brand-header';
import { OrgDocumentBranding } from '@/components/org-document-branding';
import { UserMenu } from '@/components/user-menu';
import { api } from '@/lib/api';
import { isAdminRole } from '@/lib/auth-redirect';
import { useSession } from '@/lib/auth-client';
import type { Organization } from '@/lib/types';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace('/login');
    if (!isPending && session && isAdminRole(session.user.role)) router.replace('/dashboard');
  }, [isPending, session, router]);

  const { data: org } = useQuery<Organization>({
    queryKey: ['organization', 'portal'],
    queryFn: () => api.get<Organization>('/organization'),
    enabled: !!session,
  });

  if (isPending || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <OrgDocumentBranding name={org?.name} logoUrl={org?.logoUrl} organizationId={org?.id} />
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <OrgBrandHeader name={org?.name} logoUrl={org?.logoUrl} />
          </div>
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
