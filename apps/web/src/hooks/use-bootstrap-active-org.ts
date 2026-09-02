"use client";

import { useEffect, useRef } from "react";
import { useActiveOrgId } from "@/hooks/use-active-org";
import { useHostOrg } from "@/hooks/use-host-org";
import { useMyOrganizations } from "@/hooks/use-my-organizations";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import {
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "@/lib/org-context";

/**
 * Garante org activa no localStorage/sessao antes do shell renderizar.
 * Em dominio custom, forca a org do host (excepto Imperador, que pode trocar).
 */
export function useBootstrapActiveOrganization(enabled: boolean) {
  const activeOrgId = useActiveOrgId();
  const bootstrapped = useRef(false);
  const { data: session } = useSession();
  const globalRole = (session?.user as { role?: string | null } | undefined)
    ?.role;
  const { data: hostOrg, isLoading: hostLoading } = useHostOrg();

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

  const hostMismatch =
    enabled &&
    !orgsLoading &&
    !hostLoading &&
    hostOrg?.kind === "org" &&
    !!orgs &&
    globalRole !== "imperador" &&
    !orgs.some((o) => o.id === hostOrg.id);

  useEffect(() => {
    if (!enabled || bootstrapped.current) return;
    if (orgsLoading || hostLoading || !orgs) return;

    if (hostOrg?.kind === "org") {
      const allowed =
        globalRole === "imperador" || orgs.some((o) => o.id === hostOrg.id);
      if (!allowed) {
        bootstrapped.current = true;
        return;
      }

      bootstrapped.current = true;
      if (getActiveOrganizationId() !== hostOrg.id) {
        setActiveOrganizationId(hostOrg.id);
      }
      void api
        .post("/me/active-organization", { organizationId: hostOrg.id })
        .catch(() => undefined);
      return;
    }

    if (!orgs.length) return;

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
  }, [enabled, orgs, orgsLoading, hostOrg, hostLoading, globalRole]);

  const isBootstrapping =
    enabled &&
    !hostMismatch &&
    (orgsLoading ||
      hostLoading ||
      (!!orgs?.length && !activeOrgId && hostOrg?.kind !== "org"));

  return { orgs, isBootstrapping, orgsError, refetchOrgs, hostMismatch };
}
