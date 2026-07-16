"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type {
  MemberPlanFilter,
  MemberStatusFilter,
} from "@/components/members/member-filters";
import { PAGE_SIZE } from "@/components/members/members-shared";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import type {
  Member,
  MembershipPlan,
  PaginatedResult,
  QuotaStatus,
} from "@/lib/types";

/** Filtros, paginação e queries da lista de membros. */
export function useMembersList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [quotaFilter, setQuotaFilter] = useState<QuotaStatus | "">("");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("");
  const [planFilter, setPlanFilter] = useState<MemberPlanFilter>("");

  const membersKey = useTenantQueryKey([
    "members",
    search,
    page,
    quotaFilter,
    statusFilter,
    planFilter,
  ]);
  const plansKey = useTenantQueryKey(["membership-plans"]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const membersQuery = useQuery<PaginatedResult<Member>>({
    queryKey: membersKey,
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (quotaFilter) params.set("quotaStatus", quotaFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("quotaPlanId", planFilter);
      return api.get<PaginatedResult<Member>>(`/members?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const plansQuery = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const membersPage = membersQuery.data;
  const members = membersPage?.items ?? [];
  const isInitialLoad = membersQuery.isPending && !membersPage;
  const isPageTransition =
    membersQuery.isFetching && membersQuery.isPlaceholderData;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setQuotaFilter("");
    setStatusFilter("");
    setPlanFilter("");
    setPage(1);
  }

  return {
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    quotaFilter,
    setQuotaFilter,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    membersPage,
    members,
    plans: plansQuery.data,
    isInitialLoad,
    isPageTransition,
    membersError: membersQuery.isError,
    refetchMembers: membersQuery.refetch,
    clearFilters,
  };
}
