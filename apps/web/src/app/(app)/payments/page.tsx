"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PaymentsCreateForm } from "@/components/payments/payments-create-form";
import { PaymentsList } from "@/components/payments/payments-list";
import type {
  PickerPlanFilter,
  PickerQuotaFilter,
  PickerStatusFilter,
} from "@/components/payments/payments-member-picker";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { RoleGateSkeleton } from "@/components/page-skeletons";
import { useMembersPicker } from "@/hooks/use-members-picker";
import { usePaymentsMutations } from "@/hooks/use-payments-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import { todayDateInput } from "@/lib/date-input";
import { STAFF_ROLES } from "@/lib/staff-roles";
import type {
  Member,
  MembershipPlan,
  PaginatedResult,
  Payment,
  PaymentMethod,
} from "@/lib/types";

export default function PaymentsPage() {
  return (
    <RoleGate roles={[...STAFF_ROLES]}>
      <Suspense fallback={<RoleGateSkeleton />}>
        <PaymentsPageContent />
      </Suspense>
    </RoleGate>
  );
}

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const prefillMemberId = searchParams.get("memberId") ?? "";

  const [memberId, setMemberId] = useState(prefillMemberId);
  const [prevPrefillMemberId, setPrevPrefillMemberId] =
    useState(prefillMemberId);
  if (prefillMemberId !== prevPrefillMemberId) {
    setPrevPrefillMemberId(prefillMemberId);
    setMemberId(prefillMemberId);
  }
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(todayDateInput);
  const [quotaFilter, setQuotaFilter] = useState<PickerQuotaFilter>("");
  const [statusFilter, setStatusFilter] = useState<PickerStatusFilter>("");
  const [planFilter, setPlanFilter] = useState<PickerPlanFilter>("");

  const paymentsKey = useTenantQueryKey(["payments"]);
  const plansKey = useTenantQueryKey(["membership-plans"]);

  const {
    data: paymentsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResult<Payment>>({
    queryKey: paymentsKey,
    queryFn: () => api.get<PaginatedResult<Payment>>("/payments?limit=500"),
  });
  const payments = paymentsPage?.items;

  const {
    members,
    activate: activateMembersPicker,
    isLoading: membersLoading,
    hasMore: membersHasMore,
    searchInput: memberSearchInput,
    setSearchInput: setMemberSearchInput,
  } = useMembersPicker({
    immediate: Boolean(prefillMemberId),
    status: statusFilter,
    quotaPlanId: planFilter,
    quotaStatus: quotaFilter,
  });

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const prefillKey = useTenantQueryKey(["members", "prefill", prefillMemberId]);
  const { data: prefillMember } = useQuery<Member>({
    queryKey: prefillKey,
    queryFn: () => api.get<Member>(`/members/${prefillMemberId}`),
    enabled: Boolean(prefillMemberId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!prefillMemberId) return;
    activateMembersPicker();
    requestAnimationFrame(() => {
      document
        .getElementById("register-payment-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [prefillMemberId, activateMembersPicker]);

  const selectedMember = useMemo(() => {
    const fromList = members.find((m) => m.id === memberId);
    if (fromList) return fromList;
    if (prefillMember?.id === memberId) return prefillMember;
    return undefined;
  }, [members, memberId, prefillMember]);

  const suggestedAmount = useMemo(() => {
    if (!selectedMember?.quotaPlan) return "";
    const plan = plans?.find((p) => p.id === selectedMember.quotaPlan?.id);
    return plan ? Number(plan.amount).toFixed(2) : "";
  }, [selectedMember, plans]);

  const { createPayment } = usePaymentsMutations();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Pagamentos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Regista pagamentos de quotas e emite comprovativos em PDF.
      </p>

      {isError && (
        <div className="mb-6">
          <QueryErrorCard onRetry={() => void refetch()} />
        </div>
      )}

      <PaymentsCreateForm
        memberId={memberId}
        setMemberId={setMemberId}
        amount={amount}
        setAmount={setAmount}
        method={method}
        setMethod={setMethod}
        paidAt={paidAt}
        setPaidAt={setPaidAt}
        members={members}
        membersLoading={membersLoading}
        membersHasMore={membersHasMore}
        memberSearchInput={memberSearchInput}
        setMemberSearchInput={setMemberSearchInput}
        activateMembersPicker={activateMembersPicker}
        selectedMember={selectedMember}
        plans={plans}
        quotaFilter={quotaFilter}
        setQuotaFilter={setQuotaFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        planFilter={planFilter}
        setPlanFilter={setPlanFilter}
        suggestedAmount={suggestedAmount}
        isPending={createPayment.isPending}
        onSubmit={() => {
          createPayment.mutate(
            { memberId, method, amount, paidAt },
            {
              onSuccess: () => {
                setMemberId("");
                setAmount("");
                setMethod("CASH");
                setPaidAt(todayDateInput());
              },
            },
          );
        }}
      />

      <PaymentsList payments={payments} isLoading={isLoading} />
    </div>
  );
}
