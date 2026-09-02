"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HostOrgResponse } from "@/lib/host-org";

export const HOST_ORG_QUERY_KEY = ["public", "host-org"] as const;

/** Branding e lock do hostname actual (publico, sem auth). */
export function useHostOrg() {
  return useQuery<HostOrgResponse>({
    queryKey: HOST_ORG_QUERY_KEY,
    queryFn: () => api.get<HostOrgResponse>("/public/host-org"),
    staleTime: 5 * 60_000,
  });
}
