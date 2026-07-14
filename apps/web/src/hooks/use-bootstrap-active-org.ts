"use client";

import { useEffect, useRef } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useMyOrganizations } from "@/hooks/use-my-organizations";
import { api } from "@/lib/api";
import {
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "@/lib/org-context";

/**
 * Garante org activa no localStorage/sessao antes do shell renderizar.
 * Corre no layout (mesmo durante skeleton) — o OrgSwitcher so aparece depois.
 */
export function useBootstrapActiveOrganization(enabled: boolean) {
  const activeOrgId = useActiveOrgId();
  const bootstrapped = useRef(false);

  const {
    data: orgs,
    isLoading: orgsLoading,
    isError: orgsError,
    refetch: refetchOrgs,
  } = useMyOrganizations(enabled);

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

  return { orgs, isBootstrapping, orgsError, refetchOrgs };
}
