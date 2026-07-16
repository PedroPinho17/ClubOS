import type { Periodicity } from "@clubos/database";
import type { QuotaSituation, QuotaStatus } from "@clubos/shared";

export type { QuotaSituation, QuotaStatus } from "@clubos/shared";

const PERIOD_MONTHS: Record<Periodicity, number | null> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  BIANNUAL: 6,
  ANNUAL: 12,
  ONCE: null,
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Calcula a situacao de quota de um socio a partir do plano e do ultimo
 * pagamento pago. Regras simples e deterministicas (Fase 2 V1).
 */
export function computeQuotaSituation(input: {
  periodicity: Periodicity | null | undefined;
  joinedAt: Date;
  lastPaidAt: Date | null;
  cardValidUntil?: Date | null;
  /** Dias antes do vencimento para estado due_soon (0 = desactivado). */
  dueSoonDays?: number;
}): QuotaSituation {
  const {
    periodicity,
    joinedAt,
    lastPaidAt,
    cardValidUntil,
    dueSoonDays = 0,
  } = input;

  if (!periodicity) {
    return {
      status: "no_plan",
      nextDueDate: null,
      lastPaymentAt: lastPaidAt?.toISOString() ?? null,
    };
  }

  const months = PERIOD_MONTHS[periodicity];

  if (months === null) {
    return {
      status: lastPaidAt ? "up_to_date" : "pending",
      nextDueDate: null,
      lastPaymentAt: lastPaidAt?.toISOString() ?? null,
    };
  }

  const baseline = lastPaidAt ?? joinedAt;
  let nextDue = addMonths(baseline, months);

  if (cardValidUntil && cardValidUntil > nextDue) {
    nextDue = cardValidUntil;
  }

  const now = startOfDay(new Date());
  const due = startOfDay(nextDue);
  const nextDueIso = nextDue.toISOString();

  if (now > due) {
    return {
      status: "overdue",
      nextDueDate: nextDueIso,
      lastPaymentAt: lastPaidAt?.toISOString() ?? null,
      daysOverdue: dayDiff(due, now),
    };
  }

  const daysUntil = dayDiff(now, due);
  if (dueSoonDays > 0 && daysUntil <= dueSoonDays) {
    return {
      status: "due_soon",
      nextDueDate: nextDueIso,
      lastPaymentAt: lastPaidAt?.toISOString() ?? null,
      daysUntilDue: daysUntil,
    };
  }

  return {
    status: "up_to_date" satisfies QuotaStatus,
    nextDueDate: nextDueIso,
    lastPaymentAt: lastPaidAt?.toISOString() ?? null,
    daysUntilDue: daysUntil,
  };
}
