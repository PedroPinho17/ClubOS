import { Periodicity } from '@clubos/database';

export type QuotaStatus = 'up_to_date' | 'overdue' | 'no_plan' | 'pending';

export interface QuotaSituation {
  status: QuotaStatus;
  nextDueDate: string | null;
  lastPaymentAt: string | null;
}

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

/**
 * Calcula a situacao de quota de um socio a partir do plano e do ultimo
 * pagamento pago. Regras simples e deterministicas (Fase 2 V1).
 */
export function computeQuotaSituation(input: {
  periodicity: Periodicity | null | undefined;
  joinedAt: Date;
  lastPaidAt: Date | null;
  cardValidUntil?: Date | null;
}): QuotaSituation {
  const { periodicity, joinedAt, lastPaidAt, cardValidUntil } = input;

  if (!periodicity) {
    return { status: 'no_plan', nextDueDate: null, lastPaymentAt: lastPaidAt?.toISOString() ?? null };
  }

  const months = PERIOD_MONTHS[periodicity];

  // Plano de pagamento unico: pago = em dia; sem pagamento = pendente.
  if (months === null) {
    return {
      status: lastPaidAt ? 'up_to_date' : 'pending',
      nextDueDate: null,
      lastPaymentAt: lastPaidAt?.toISOString() ?? null,
    };
  }

  const baseline = lastPaidAt ?? joinedAt;
  let nextDue = addMonths(baseline, months);

  // Validade manual do cartao sobrepoe (se definida e posterior).
  if (cardValidUntil && cardValidUntil > nextDue) {
    nextDue = cardValidUntil;
  }

  const now = new Date();
  return {
    status: now <= nextDue ? 'up_to_date' : 'overdue',
    nextDueDate: nextDue.toISOString(),
    lastPaymentAt: lastPaidAt?.toISOString() ?? null,
  };
}
