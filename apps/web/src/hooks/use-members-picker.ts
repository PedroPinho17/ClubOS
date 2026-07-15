"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Member, PaginatedResult } from "@/lib/types";
import { useTenantQueryKey } from "./use-tenant-query-key";

const PICKER_LIMIT = 50;

type UseMembersPickerOptions = {
  /** Carrega logo ao montar (ex.: cartões com auto-seleção). Default: lazy no focus do select. */
  immediate?: boolean;
};

/**
 * Lista de sócios para selects (pagamentos, cartões) com pesquisa no servidor.
 */
export function useMembersPicker(opts: UseMembersPickerOptions = {}) {
  const [activated, setActivated] = useState(opts.immediate ?? false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const membersKey = useTenantQueryKey(["members", "picker", search]);

  const query = useQuery<PaginatedResult<Member>>({
    queryKey: membersKey,
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PICKER_LIMIT),
        page: "1",
      });
      if (search) params.set("search", search);
      return api.get<PaginatedResult<Member>>(`/members?${params}`);
    },
    enabled: activated,
    staleTime: 60_000,
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
    hasMore: !search && total > PICKER_LIMIT,
    searchInput,
    setSearchInput,
  };
}
