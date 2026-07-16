"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { MembershipPlan, Periodicity } from "@/lib/types";

type CreatePlanInput = {
  name: string;
  amount: string;
  periodicity: Periodicity;
};

export function useMembershipPlansMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["membership-plans"] });

  const createPlan = useMutation({
    mutationFn: (input: CreatePlanInput) =>
      api.post<MembershipPlan>("/membership-plans", {
        name: input.name,
        amount: Number(input.amount),
        periodicity: input.periodicity,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Plano criado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: (plan: MembershipPlan) =>
      api.patch(`/membership-plans/${plan.id}`, { active: !plan.active }),
    onSuccess: (_, plan) => {
      invalidate();
      toast.success(plan.active ? "Plano desativado" : "Plano ativado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/membership-plans/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Plano removido");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { createPlan, toggleActive, removePlan };
}
