import { describe, expect, it } from 'vitest';
import { TEMPLATE_HEADERS } from './member-import-column-map';
import {
  buildMemberExportRows,
  compareMemberNumbers,
  rowFromMember,
  sortPaymentsChronologically,
} from './member-export-rows';

const baseMember = {
  id: 'm1',
  organizationId: 'org1',
  number: '5',
  name: 'Ana Exportada',
  email: 'ana@clube.pt',
  phone: '912345678',
  joinedAt: new Date('2024-05-10T00:00:00.000Z'),
  status: 'ACTIVE' as const,
  photoKey: null,
  notes: 'Nota teste',
  cardRole: 'Sénior',
  cardValidUntil: null,
  userId: null,
  quotaPlanId: 'p1',
  createdAt: new Date(),
  updatedAt: new Date(),
  quotaPlan: {
    id: 'p1',
    organizationId: 'org1',
    name: 'Quota mensal',
    amount: { toString: () => '15' },
    periodicity: 'MONTHLY' as const,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  payments: [] as Array<{
    id: string;
    organizationId: string;
    memberId: string;
    quotaPlanId: string | null;
    amount: { toString(): string };
    method: 'CASH';
    status: 'PAID';
    reference: string | null;
    receiptKey: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
};

describe('rowFromMember', () => {
  it('maps member fields to import template columns', () => {
    const row = rowFromMember(baseMember as never);
    expect(row[0]).toBe('5');
    expect(row[1]).toBe('Ana Exportada');
    expect(row[5]).toBe('Quota mensal');
    expect(row[8]).toBe('Sim');
  });

  it('adds payment on continuation row with only number', () => {
    const payment = {
      id: 'pay2',
      organizationId: 'org1',
      memberId: 'm1',
      quotaPlanId: null,
      amount: { toString: () => '15' },
      method: 'CASH' as const,
      status: 'PAID' as const,
      reference: '2026-02',
      receiptKey: null,
      paidAt: new Date('2026-02-01T00:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const row = rowFromMember(baseMember as never, payment as never, false);
    expect(row[0]).toBe('5');
    expect(row[1]).toBe('');
    expect(row[12]).toBe('2026-02');
    expect(row[11]).toBe('15,00');
  });
});

describe('buildMemberExportRows', () => {
  it('produces import-compatible rows with payment continuations', () => {
    const member = {
      ...baseMember,
      payments: [
        {
          id: 'pay1',
          organizationId: 'org1',
          memberId: 'm1',
          quotaPlanId: null,
          amount: { toString: () => '15' },
          method: 'CASH' as const,
          status: 'PAID' as const,
          reference: '2026-01',
          receiptKey: null,
          paidAt: new Date('2026-01-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date(),
        },
        {
          id: 'pay2',
          organizationId: 'org1',
          memberId: 'm1',
          quotaPlanId: null,
          amount: { toString: () => '15' },
          method: 'CASH' as const,
          status: 'PAID' as const,
          reference: '2026-02',
          receiptKey: null,
          paidAt: new Date('2026-02-01T00:00:00.000Z'),
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date(),
        },
      ],
    };

    const rows = buildMemberExportRows([member as never]);
    expect(rows[0]).toEqual([...TEMPLATE_HEADERS]);
    expect(rows[1][1]).toBe('Ana Exportada');
    expect(rows[1][12]).toBe('2026-01');
    expect(rows[2][0]).toBe('5');
    expect(rows[2][1]).toBe('');
    expect(rows[2][12]).toBe('2026-02');
  });
});

describe('compareMemberNumbers', () => {
  it('sorts numerically when possible', () => {
    expect(compareMemberNumbers('2', '10')).toBeLessThan(0);
    expect(compareMemberNumbers('10', '2')).toBeGreaterThan(0);
  });
});

describe('sortPaymentsChronologically', () => {
  it('orders by paidAt then id', () => {
    const p1 = { id: 'b', paidAt: new Date('2026-02-01'), createdAt: new Date() };
    const p2 = { id: 'a', paidAt: new Date('2026-01-01'), createdAt: new Date() };
    const sorted = sortPaymentsChronologically([p1, p2] as never);
    expect(sorted[0].id).toBe('a');
  });
});
