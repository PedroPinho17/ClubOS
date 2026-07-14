"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useSession } from "@/lib/auth-client";

import type { ActiveContext } from "@/lib/types";

/** Papel efectivo na organizacao activa (alinhado com a API). */
export function useEffectiveRole() {
  const { data: session } = useSession();
  const activeOrgId = useActiveOrgId();

  const { data, isLoading, isError, refetch } = useQuery<ActiveContext>({
    queryKey: ["me", "context", activeOrgId],
    queryFn: () => api.get<ActiveContext>("/me/context"),
    enabled: !!session && !!activeOrgId,
    staleTime: 30_000,
  });

  return {
    effectiveRole: data?.effectiveRole ?? null,
    organizationId: data?.organizationId ?? activeOrgId,
    isLoading: !!session && (!activeOrgId || isLoading),
    isError,
    refetch,
  };
}
