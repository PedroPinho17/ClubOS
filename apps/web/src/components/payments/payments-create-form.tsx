"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Member, MembershipPlan, PaymentMethod } from "@/lib/types";
import {
  PaymentsMemberPicker,
  type PickerPlanFilter,
  type PickerQuotaFilter,
  type PickerStatusFilter,
} from "./payments-member-picker";
import { METHOD_LABEL } from "./payments-shared";

type PaymentsCreateFormProps = {
  memberId: string;
  setMemberId: (id: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  paidAt: string;
  setPaidAt: (v: string) => void;
  members: Member[];
  membersLoading: boolean;
  membersHasMore: boolean;
  memberSearchInput: string;
  setMemberSearchInput: (v: string) => void;
  activateMembersPicker: () => void;
  selectedMember: Member | undefined;
  plans: MembershipPlan[] | undefined;
  quotaFilter: PickerQuotaFilter;
  setQuotaFilter: (v: PickerQuotaFilter) => void;
  statusFilter: PickerStatusFilter;
  setStatusFilter: (v: PickerStatusFilter) => void;
  planFilter: PickerPlanFilter;
  setPlanFilter: (v: PickerPlanFilter) => void;
  suggestedAmount: string;
  isPending: boolean;
  onSubmit: () => void;
};

export function PaymentsCreateForm({
  memberId,
  setMemberId,
  amount,
  setAmount,
  method,
  setMethod,
  paidAt,
  setPaidAt,
  members,
  membersLoading,
  membersHasMore,
  memberSearchInput,
  setMemberSearchInput,
  activateMembersPicker,
  selectedMember,
  plans,
  quotaFilter,
  setQuotaFilter,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  suggestedAmount,
  isPending,
  onSubmit,
}: PaymentsCreateFormProps) {
  return (
    <Card id="register-payment-form" className="mb-6">
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (memberId) onSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <PaymentsMemberPicker
            memberId={memberId}
            setMemberId={setMemberId}
            members={members}
            membersLoading={membersLoading}
            membersHasMore={membersHasMore}
            searchInput={memberSearchInput}
            setSearchInput={setMemberSearchInput}
            activate={activateMembersPicker}
            selectedMember={selectedMember}
            plans={plans}
            quotaFilter={quotaFilter}
            setQuotaFilter={setQuotaFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
          />

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Valor (€)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder={suggestedAmount || "0.00"}
              />
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium">Data do pagamento</label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Data do pagamento define o próximo vencimento.
              </p>
            </div>
            <div className="w-40 space-y-1">
              <label className="text-sm font-medium" htmlFor="payment-method">
                Método
              </label>
              <select
                id="payment-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isPending || !memberId}>
              {isPending ? "A registar..." : "Registar pagamento"}
            </Button>
          </div>
        </form>
        {selectedMember && suggestedAmount && !amount && (
          <p className="mt-2 text-xs text-muted-foreground">
            Valor do plano ({selectedMember.quotaPlan?.name}): {suggestedAmount}{" "}
            € — deixa vazio para usar este valor.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
