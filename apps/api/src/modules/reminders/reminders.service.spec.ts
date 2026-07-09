import { PaymentStatus, Periodicity, QuotaReminderKind } from '@clubos/database';
import { describe, expect, it, vi } from 'vitest';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  it('nao reenvia lembrete se QuotaReminderSent ja existe', async () => {
    const send = vi.fn();
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 3);

    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'org-1',
          name: 'CRC Vale',
          primaryColor: '#1d4ed8',
          logoUrl: null,
        }),
      },
      organizationSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'lembretes_automaticos', value: 'true' },
          { key: 'dias_aviso_quota', value: '7' },
        ]),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'member-1',
            organizationId: 'org-1',
            name: 'Joao',
            email: 'joao@example.com',
            joinedAt: new Date('2025-01-01'),
            cardValidUntil: null,
            quotaPlan: { periodicity: Periodicity.MONTHLY },
            payments: [],
          },
        ]),
      },
      quotaReminderSent: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing' }),
        create: vi.fn(),
      },
    };

    const service = new RemindersService(prisma as never, { send } as never);
    const result = await service.runForOrganization('org-1');

    expect(result.skipped).toBe(1);
    expect(result.dueSoonSent).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(prisma.quotaReminderSent.create).not.toHaveBeenCalled();
  });

  it('envia lembrete e regista QuotaReminderSent na primeira vez', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const paidAt = new Date();
    paidAt.setMonth(paidAt.getMonth() - 1);

    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'org-1',
          name: 'CRC Vale',
          primaryColor: '#1d4ed8',
          logoUrl: null,
        }),
      },
      organizationSetting: {
        findMany: vi.fn().mockResolvedValue([
          { key: 'lembretes_automaticos', value: 'true' },
          { key: 'dias_aviso_quota', value: '7' },
        ]),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'member-2',
            organizationId: 'org-1',
            name: 'Maria',
            email: 'maria@example.com',
            joinedAt: new Date('2024-01-01'),
            cardValidUntil: null,
            quotaPlan: { periodicity: Periodicity.MONTHLY },
            payments: [{ paidAt, status: PaymentStatus.PAID }],
          },
        ]),
      },
      quotaReminderSent: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const service = new RemindersService(prisma as never, { send } as never);
    const result = await service.runForOrganization('org-1');

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@example.com',
        html: expect.stringContaining('Maria'),
      }),
    );
    expect(prisma.quotaReminderSent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: 'member-2',
          kind: expect.any(String),
        }),
      }),
    );
    expect(result.dueSoonSent + result.overdueSent).toBeGreaterThanOrEqual(0);
  });
});
