"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { api } from "@/lib/api";
import {
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "@/lib/org-context";
import type { MyOrganization } from "@/lib/types";

/**
 * Garante org activa no localStorage/sessao antes do shell renderizar.
 * Corre no layout (mesmo durante skeleton) — o OrgSwitcher so aparece depois.
 */
export function useBootstrapActiveOrganization(enabled: boolean) {
  const activeOrgId = useActiveOrgId();
  const bootstrapped = useRef(false);

  const { data: orgs, isLoading: orgsLoading } = useQuery<MyOrganization[]>({
    queryKey: ["me", "organizations"],
    queryFn: () => api.get<MyOrganization[]>("/me/organizations"),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!enabled) {
      bootstrapped.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !orgs?.length || bootstrapped.current) return;
    bootstrapped.current = true;

    const stored = getActiveOrganizationId();
    const valid =
      stored && orgs.some((o) => o.id === stored) ? stored : orgs[0].id;

    if (!stored || valid !== stored) {
      setActiveOrganizationId(valid);
    }

    void api
      .post("/me/active-organization", { organizationId: valid })
      .catch(() => {
        // sessao ainda a carregar — o switcher manual corrige depois
      });
  }, [enabled, orgs]);

  const isBootstrapping =
    enabled && (orgsLoading || (!!orgs?.length && !activeOrgId));

  return { orgs, isBootstrapping };
}
