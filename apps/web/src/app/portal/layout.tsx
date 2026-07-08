'use client';

import { useQuery } from '@tanstack/react-query';
import { OrgBrandHeader } from '@/components/org-brand-header';
import { OrgDocumentBranding } from '@/components/org-document-branding';
import { UserMenu } from '@/components/user-menu';
import { api } from '@/lib/api';
import { redirectAdminFromPortal } from '@/lib/auth-redirect';
import type { Organization } from '@/lib/types';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useRequireAuth({ redirectIf: redirectAdminFromPortal });

  const { data: org } = useQuery<Organization>({
    queryKey: ['organization', 'portal'],
    queryFn: () => api.get<Organization>('/organization'),
    enabled: !!session,
  });

  if (isLoading || !session) {
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
