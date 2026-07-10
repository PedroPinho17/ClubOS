"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Member, PaginatedResult } from "@/lib/types";
import { useTenantQueryKey } from "./use-tenant-query-key";

const PICKER_LIMIT = 100;

type UseMembersPickerOptions = {
  /** Carrega logo ao montar (ex.: cartões com auto-seleção). Default: lazy no focus do select. */
  immediate?: boolean;
};

/**
 * Lista leve de sócios para selects (pagamentos, cartões).
 * Cache separado da lista paginada em /members e limite menor que 500.
 */
export function useMembersPicker(opts: UseMembersPickerOptions = {}) {
  const [activated, setActivated] = useState(opts.immediate ?? false);
  const membersKey = useTenantQueryKey(["members", "picker"]);

  const query = useQuery<PaginatedResult<Member>>({
    queryKey: membersKey,
    queryFn: () =>
      api.get<PaginatedResult<Member>>(`/members?limit=${PICKER_LIMIT}&page=1`),
    enabled: activated,
    staleTime: 5 * 60_000,
  });

  const activate = () => {
    if (!activated) setActivated(true);
  };

  const total = query.data?.total ?? 0;

  return {
    members: query.data?.items ?? [],
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    activate,
    hasMore: total > PICKER_LIMIT,
  };
}
