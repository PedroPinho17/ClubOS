"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { sessionMustChangePassword } from "@/lib/auth-redirect";

type UseRequireAuthOptions = {
  /** Redireciona para este path quando o role devolver um path (ex.: socio → /portal). */
  redirectIf?: (role: string) => string | null;
  /** Se false, não força /change-password (ex.: na própria página de alteração). */
  enforcePasswordChange?: boolean;
};

/**
 * Garante sessão autenticada antes de renderizar rotas protegidas.
 * Evita bounce para /login durante refetch (ex.: após sign-in ou React Strict Mode).
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, isRefetching } = useSession();
  const awaitingSession = isPending || (isRefetching && !session);
  const enforcePasswordChange = options.enforcePasswordChange !== false;
  const roleRedirect = session
    ? (options.redirectIf?.(session.user.role ?? "") ?? null)
    : null;

  useEffect(() => {
    if (awaitingSession) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (
      enforcePasswordChange &&
      sessionMustChangePassword(session.user) &&
      pathname !== "/change-password"
    ) {
      router.replace("/change-password");
      return;
    }

    if (roleRedirect) router.replace(roleRedirect);
  }, [
    awaitingSession,
    session,
    router,
    pathname,
    roleRedirect,
    enforcePasswordChange,
  ]);

  return {
    session,
    isLoading: (awaitingSession && !session) || !!roleRedirect,
  };
}
