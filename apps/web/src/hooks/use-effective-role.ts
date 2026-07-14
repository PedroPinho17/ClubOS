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

  const { data, isLoading, isError, isFetched, refetch } =
    useQuery<ActiveContext>({
      queryKey: ["me", "context", activeOrgId],
      queryFn: () => api.get<ActiveContext>("/me/context"),
      enabled: !!session && !!activeOrgId,
      staleTime: 30_000,
      retry: 1,
    });

  const waitingForOrg = !!session && !activeOrgId;
  const waitingForRole =
    !!session && !!activeOrgId && (isLoading || (!isFetched && !isError));

  return {
    effectiveRole: data?.effectiveRole ?? null,
    organizationId: data?.organizationId ?? activeOrgId,
    isLoading: waitingForOrg || waitingForRole,
    isError: !!session && !!activeOrgId && isError,
    isReady: !!data?.effectiveRole,
    refetch,
  };
}
