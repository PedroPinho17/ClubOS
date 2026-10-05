import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  const prisma = {
    member: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    organizationSetting: {
      findMany: vi.fn(),
    },
  };

  const service = new DashboardService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.member.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prisma.payment.count.mockResolvedValue(5);
    prisma.payment.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 100 } })
      .mockResolvedValueOnce({ _sum: { amount: 40 } })
      .mockResolvedValueOnce({ _sum: { amount: 20 } });
    prisma.payment.findMany.mockResolvedValue([
      {
        id: "pay-1",
        amount: 15,
        paidAt: new Date("2026-03-01T10:00:00.000Z"),
        createdAt: new Date("2026-03-01T09:00:00.000Z"),
        member: { name: "Ana", number: "1" },
      },
    ]);
    prisma.organizationSetting.findMany.mockResolvedValue([]);
  });

  it("agrega stats e marca overdue / due_soon", async () => {
    prisma.organizationSetting.findMany.mockResolvedValue([
      { key: "dias_aviso_quota", value: 7 },
    ]);
    prisma.member.findMany.mockResolvedValue([
      {
        joinedAt: new Date("2020-01-01T00:00:00.000Z"),
        cardValidUntil: null,
        quotaPlan: { periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2020-02-01T00:00:00.000Z") }],
      },
      {
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        cardValidUntil: null,
        quotaPlan: { periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date() }],
      },
      {
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        cardValidUntil: null,
        quotaPlan: { periodicity: "ONCE" },
        payments: [{ paidAt: new Date() }],
      },
    ]);

    const stats = await service.stats("org-1");

    expect(prisma.member.count).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
    });
    expect(stats.members).toBe(10);
    expect(stats.activeMembers).toBe(8);
    expect(stats.payments).toBe(5);
    expect(stats.revenue).toBe(100);
    expect(stats.revenueThisMonth).toBe(40);
    expect(stats.revenuePrevMonth).toBe(20);
    expect(stats.revenueMonthChangePct).toBe(100);
    expect(stats.overdue).toBeGreaterThanOrEqual(1);
    expect(stats.recentPayments).toEqual([
      {
        id: "pay-1",
        amount: 15,
        paidAt: "2026-03-01T10:00:00.000Z",
        memberName: "Ana",
        memberNumber: "1",
      },
    ]);
  });

  it("revenueMonthChangePct e null quando mes anterior e 0", async () => {
    prisma.payment.aggregate
      .mockReset()
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: 5 } })
      .mockResolvedValueOnce({ _sum: { amount: 0 } });
    prisma.member.findMany.mockResolvedValue([]);

    const stats = await service.stats("org-2");

    expect(stats.revenue).toBe(0);
    expect(stats.revenueMonthChangePct).toBeNull();
    expect(stats.overdue).toBe(0);
    expect(stats.dueSoon).toBe(0);
  });
});
