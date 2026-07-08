'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading } = useRequireAuth();

  if (isLoading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-lg space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          ← Voltar
        </Button>
        {children}
      </div>
    </div>
  );
}
