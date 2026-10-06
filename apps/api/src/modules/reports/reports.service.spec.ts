import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  const prisma = {
    organization: { findUnique: vi.fn() },
    organizationSetting: { findMany: vi.fn() },
    member: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
  };
  const service = new ReportsService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.organizationSetting.findMany.mockResolvedValue([]);
  });

  it("getOrganizationName com fallback", async () => {
    prisma.organization.findUnique.mockResolvedValue(null);
    await expect(service.getOrganizationName("o1")).resolves.toBe(
      "Organização",
    );
    prisma.organization.findUnique.mockResolvedValue({ name: "CRC Vale" });
    await expect(service.getOrganizationName("o1")).resolves.toBe("CRC Vale");
  });

  it("overview agrega membros, quotas e receita", async () => {
    const now = new Date();
    prisma.member.findMany.mockResolvedValue([
      {
        status: "ACTIVE",
        joinedAt: new Date("2020-01-01"),
        cardValidUntil: null,
        quotaPlan: { name: "Mensal", periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2020-02-01") }],
      },
      {
        status: "INACTIVE",
        joinedAt: now,
        cardValidUntil: null,
        quotaPlan: null,
        payments: [],
      },
    ]);
    prisma.payment.findMany.mockResolvedValue([
      {
        amount: 10,
        paidAt: now,
        createdAt: now,
      },
      {
        amount: 5,
        paidAt: null,
        createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      },
    ]);

    const out = await service.overview("org-1");
    expect(out.members.total).toBe(2);
    expect(out.members.active).toBe(1);
    expect(out.quotaBreakdown.overdue).toBeGreaterThanOrEqual(1);
    expect(out.quotaBreakdown.no_plan).toBe(1);
    expect(out.revenue.total).toBe(15);
    expect(out.revenue.monthly).toHaveLength(6);
    expect(out.membersByPlan.length).toBeGreaterThanOrEqual(1);
  });

  it("membersCsv escapa celulas e inclui quota", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        number: "1",
        name: 'Ana "X"',
        email: "a@x.pt",
        phone: null,
        status: "ACTIVE",
        joinedAt: new Date(),
        cardValidUntil: null,
        quotaPlan: { name: "Mensal", periodicity: "ONCE" },
        payments: [{ paidAt: new Date() }],
      },
    ]);
    const csv = await service.membersCsv("org-1");
    expect(csv).toContain("Numero,Nome");
    expect(csv).toContain('"Ana ""X"""');
  });

  it("paymentsCsv lista pagamentos", async () => {
    prisma.payment.findMany.mockResolvedValue([
      {
        paidAt: new Date("2026-01-02"),
        createdAt: new Date("2026-01-01"),
        amount: 12.5,
        method: "CASH",
        status: "PAID",
        member: { number: "1", name: "Ana" },
        quotaPlan: { name: "Mensal" },
      },
    ]);
    const csv = await service.paymentsCsv("org-1");
    expect(csv.split("\n")[0]).toContain("Data");
    expect(csv).toContain("12.50");
  });
});
