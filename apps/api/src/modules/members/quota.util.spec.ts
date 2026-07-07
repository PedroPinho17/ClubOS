import { Periodicity } from '@clubos/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeQuotaSituation } from './quota.util';

const joined = new Date('2026-01-01T00:00:00.000Z');

describe('computeQuotaSituation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sem plano → no_plan', () => {
    const r = computeQuotaSituation({ periodicity: null, joinedAt: joined, lastPaidAt: null });
    expect(r.status).toBe('no_plan');
    expect(r.nextDueDate).toBeNull();
  });

  it('plano unico sem pagamento → pending', () => {
    const r = computeQuotaSituation({
      periodicity: Periodicity.ONCE,
      joinedAt: joined,
      lastPaidAt: null,
    });
    expect(r.status).toBe('pending');
  });

  it('plano unico com pagamento → up_to_date', () => {
    const r = computeQuotaSituation({
      periodicity: Periodicity.ONCE,
      joinedAt: joined,
      lastPaidAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    expect(r.status).toBe('up_to_date');
  });

  it('mensal em dia apos ultimo pagamento', () => {
    const lastPaid = new Date('2026-06-01T00:00:00.000Z');
    const r = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt: joined,
      lastPaidAt: lastPaid,
    });
    expect(r.status).toBe('up_to_date');
    expect(r.nextDueDate).toBeTruthy();
  });

  it('mensal em atraso quando nextDue passou', () => {
    const r = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastPaidAt: new Date('2020-02-01T00:00:00.000Z'),
    });
    expect(r.status).toBe('overdue');
  });

  it('validade manual do cartao prolonga nextDue', () => {
    const lastPaid = new Date('2026-01-01T00:00:00.000Z');
    const cardValid = new Date('2030-12-31T00:00:00.000Z');
    const r = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt: joined,
      lastPaidAt: lastPaid,
      cardValidUntil: cardValid,
    });
    expect(r.status).toBe('up_to_date');
    expect(new Date(r.nextDueDate!).getTime()).toBe(cardValid.getTime());
  });
});
