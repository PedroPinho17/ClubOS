"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { redirectSocioFromAdmin } from "@/lib/auth-redirect";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useRequireAuth } from "@/hooks/use-require-auth";

type UseRequireRoleOptions = {
  roles: string[];
  redirectTo?: string;
};

/**
 * Garante que o utilizador tem um dos roles efectivos exigidos na org activa.
 * Redireciona para /dashboard (ou redirectTo) quando nao autorizado.
 */
export function useRequireRole({
  roles,
  redirectTo = "/dashboard",
}: UseRequireRoleOptions) {
  const router = useRouter();
  const { session, isLoading: authLoading } = useRequireAuth({
    redirectIf: redirectSocioFromAdmin,
  });
  const {
    effectiveRole,
    isLoading: roleLoading,
    isError: roleError,
    refetch,
  } = useEffectiveRole();

  const isLoading = authLoading || (!!session && roleLoading);
  const allowed =
    !roleError && effectiveRole != null && roles.includes(effectiveRole);

  useEffect(() => {
    if (isLoading || !session || roleError) return;
    if (effectiveRole != null && !allowed) {
      router.replace(redirectTo);
    }
  }, [
    isLoading,
    session,
    roleError,
    effectiveRole,
    allowed,
    router,
    redirectTo,
  ]);

  return { effectiveRole, isLoading, allowed, isError: roleError, refetch };
}
