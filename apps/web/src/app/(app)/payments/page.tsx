"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PaymentsCreateForm } from "@/components/payments/payments-create-form";
import { PaymentsList } from "@/components/payments/payments-list";
import { QueryErrorCard } from "@/components/query-error-card";
import { RoleGate } from "@/components/role-gate";
import { useMembersPicker } from "@/hooks/use-members-picker";
import { usePaymentsMutations } from "@/hooks/use-payments-mutations";
import { useTenantQueryKey } from "@/hooks/use-tenant-query-key";
import { api } from "@/lib/api";
import { todayDateInput } from "@/lib/date-input";
import { STAFF_ROLES } from "@/lib/staff-roles";
import type {
  MembershipPlan,
  PaginatedResult,
  Payment,
  PaymentMethod,
} from "@/lib/types";

export default function PaymentsPage() {
  return (
    <RoleGate roles={[...STAFF_ROLES]}>
      <PaymentsPageContent />
    </RoleGate>
  );
}

function PaymentsPageContent() {
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(todayDateInput);

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
  } = useMembersPicker();

  const { data: plans } = useQuery<MembershipPlan[]>({
    queryKey: plansKey,
    queryFn: () => api.get<MembershipPlan[]>("/membership-plans"),
  });

  const selectedMember = useMemo(
    () => members.find((m) => m.id === memberId),
    [members, memberId],
  );

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
