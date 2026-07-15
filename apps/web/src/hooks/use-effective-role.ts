"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useMyOrganizations } from "@/hooks/use-my-organizations";
import { api } from "@/lib/api";
import { resolveClientEffectiveRole } from "@/lib/effective-role-client";
import { useSession } from "@/lib/auth-client";

import type { ActiveContext } from "@/lib/types";

/**
 * Papel efectivo na organizacao activa.
 * Deriva de session + orgRole local; valida em background com GET /me/context.
 */
export function useEffectiveRole() {
  const { data: session } = useSession();
  const activeOrgId = useActiveOrgId();
  const globalRole = session?.user?.role;

  const {
    data: orgs,
    isLoading: orgsLoading,
    isError: orgsError,
    refetch: refetchOrgs,
  } = useMyOrganizations(!!session);

  const localRole = useMemo(
    () => resolveClientEffectiveRole(globalRole, activeOrgId, orgs),
    [globalRole, activeOrgId, orgs],
  );

  const {
    data: serverContext,
    isError: contextError,
    refetch,
  } = useQuery<ActiveContext>({
    queryKey: ["me", "context", activeOrgId],
    queryFn: () => api.get<ActiveContext>("/me/context"),
    enabled: !!session && !!activeOrgId && localRole != null,
    staleTime: 60_000,
    retry: 1,
  });

  const effectiveRole = serverContext?.effectiveRole ?? localRole;

  const waitingForOrg = !!session && !activeOrgId;
  const waitingForOrgs = !!session && !!activeOrgId && orgsLoading;
  const waitingForRole =
    !!session && !!activeOrgId && !orgsLoading && localRole == null;

  return {
    effectiveRole: effectiveRole ?? null,
    organizationId: serverContext?.organizationId ?? activeOrgId,
    isLoading: waitingForOrg || waitingForOrgs || waitingForRole,
    isError:
      !!session &&
      !!activeOrgId &&
      (orgsError || contextError || (!orgsLoading && localRole == null)),
    isReady: effectiveRole != null,
    refetch: async () => {
      await refetchOrgs();
      await refetch();
    },
  };
}
