"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Payment, PaymentMethod } from "@/lib/types";

type CreatePaymentInput = {
  memberId: string;
  method: PaymentMethod;
  amount: string;
  paidAt: string;
};

export function usePaymentsMutations() {
  const queryClient = useQueryClient();

  const createPayment = useMutation({
    mutationFn: (input: CreatePaymentInput) =>
      api.post<Payment>("/payments", {
        memberId: input.memberId,
        method: input.method,
        amount: input.amount ? Number(input.amount) : undefined,
        paidAt: input.paidAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Pagamento registado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { createPayment };
}
