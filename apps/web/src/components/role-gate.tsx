"use client";

import type { ReactNode } from "react";
import { RoleGateSkeleton } from "@/components/page-skeletons";
import { RoleContextError } from "@/components/role-context-error";
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
  fallback = <RoleGateSkeleton />,
}: RoleGateProps) {
  const { isLoading, allowed, isError, refetch } = useRequireRole({
    roles,
    redirectTo,
  });

  if (isError) {
    return <RoleContextError onRetry={() => void refetch()} />;
  }

  if (isLoading || !allowed) return fallback;
  return children;
}
