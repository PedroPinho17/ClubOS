'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';

type UseRequireAuthOptions = {
  /** Redireciona para este path quando o role devolver um path (ex.: socio → /portal). */
  redirectIf?: (role: string) => string | null;
};

/**
 * Garante sessão autenticada antes de renderizar rotas protegidas.
 * Evita bounce para /login durante refetch (ex.: após sign-in ou React Strict Mode).
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const router = useRouter();
  const { data: session, isPending, isRefetching } = useSession();
  const checking = isPending || isRefetching;

  useEffect(() => {
    if (checking) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    const redirect = options.redirectIf?.(session.user.role ?? '');
    if (redirect) router.replace(redirect);
  }, [checking, session, router, options.redirectIf]);

  return {
    session,
    isLoading: !session && checking,
  };
}
