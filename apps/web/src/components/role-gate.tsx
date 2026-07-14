"use client";

import type { ReactNode } from "react";
import { useRequireRole } from "@/hooks/use-require-role";

type RoleGateProps = {
  roles: string[];
  redirectTo?: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/** Bloqueia renderizacao ate confirmar role efectivo; redireciona se nao autorizado. */
export function RoleGate({
  roles,
  redirectTo,
  children,
  fallback = (
    <p className="text-sm text-muted-foreground">A verificar permissões...</p>
  ),
}: RoleGateProps) {
  const { isLoading, allowed } = useRequireRole({ roles, redirectTo });

  if (isLoading || !allowed) return fallback;
  return children;
}
