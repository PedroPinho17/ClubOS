import { describe, expect, it } from 'vitest';
import { daysOverdueFromIso } from './member-quota-report.util';

describe('daysOverdueFromIso', () => {
  it('returns 0 when due date is today or future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(daysOverdueFromIso(tomorrow.toISOString())).toBe(0);
  });

  it('returns positive days when overdue', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(daysOverdueFromIso(past.toISOString())).toBe(10);
  });

  it('returns 0 for null', () => {
    expect(daysOverdueFromIso(null)).toBe(0);
  });
});
