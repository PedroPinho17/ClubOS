import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberQuotaReportService } from "./member-quota-report.service";

describe("MemberQuotaReportService", () => {
  const prisma = {
    member: { findMany: vi.fn() },
  };
  const service = new MemberQuotaReportService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("payingRows filtra up_to_date", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        number: "1",
        name: "Ok",
        email: "o@x.pt",
        phone: "912",
        joinedAt: new Date("2026-01-01"),
        cardValidUntil: null,
        quotaPlan: { name: "Mensal", periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date() }],
      },
      {
        number: "2",
        name: "Atrasado",
        email: null,
        phone: null,
        joinedAt: new Date("2020-01-01"),
        cardValidUntil: null,
        quotaPlan: { name: "Mensal", periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2020-02-01") }],
      },
    ]);

    const rows = await service.payingRows("org-1");
    expect(rows.every((r) => r.situation === "Em dia")).toBe(true);
    expect(rows.some((r) => r.number === "1")).toBe(true);
  });

  it("overdueRows ordena por dias em atraso", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        number: "1",
        name: "A",
        email: "",
        phone: "",
        joinedAt: new Date("2020-01-01"),
        cardValidUntil: null,
        quotaPlan: { name: "M", periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2020-06-01") }],
      },
      {
        number: "2",
        name: "B",
        email: "",
        phone: "",
        joinedAt: new Date("2019-01-01"),
        cardValidUntil: null,
        quotaPlan: { name: "M", periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2019-02-01") }],
      },
    ]);

    const rows = await service.overdueRows("org-1");
    expect(rows.length).toBe(2);
    expect(rows[0]!.daysOverdue!).toBeGreaterThanOrEqual(rows[1]!.daysOverdue!);
    expect(rows[0]!.situation).toBe("Em atraso");
  });
});
