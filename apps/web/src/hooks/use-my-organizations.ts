"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MyOrganization } from "@/lib/types";

const ORGS_QUERY_KEY = ["me", "organizations"] as const;

/** Organizacoes acessiveis ao utilizador autenticado. */
export function useMyOrganizations(enabled = true) {
  return useQuery<MyOrganization[]>({
    queryKey: ORGS_QUERY_KEY,
    queryFn: () => api.get<MyOrganization[]>("/me/organizations"),
    enabled,
    staleTime: 60_000,
  });
}

export { ORGS_QUERY_KEY };
