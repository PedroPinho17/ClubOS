import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsController } from "./reports.controller";

describe("ReportsController", () => {
  const reports = {
    overview: vi.fn(),
    membersCsv: vi.fn(),
    paymentsCsv: vi.fn(),
    getOrganizationName: vi.fn(),
  };
  const quotaReports = {
    payingRows: vi.fn(),
    overdueRows: vi.fn(),
  };
  const listPdf = { generate: vi.fn() };
  const controller = new ReportsController(
    reports as never,
    quotaReports as never,
    listPdf as never,
  );

  const res = () => {
    const r = {
      setHeader: vi.fn(),
      end: vi.fn(),
    };
    return r;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("overview delega", async () => {
    reports.overview.mockResolvedValue({ members: { total: 0 } });
    await expect(controller.overview("org-1")).resolves.toEqual({
      members: { total: 0 },
    });
  });

  it("membersCsv e paymentsCsv escrevem attachment", async () => {
    reports.membersCsv.mockResolvedValue("a,b\n1,2");
    reports.paymentsCsv.mockResolvedValue("c,d\n3,4");
    const r1 = res();
    await controller.membersCsv("org-1", r1 as never);
    expect(r1.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/csv; charset=utf-8",
    );
    expect(r1.end).toHaveBeenCalled();

    const r2 = res();
    await controller.paymentsCsv("org-1", r2 as never);
    expect(r2.end).toHaveBeenCalled();
  });

  it("payingPdf e overduePdf geram PDF", async () => {
    reports.getOrganizationName.mockResolvedValue("CRC");
    quotaReports.payingRows.mockResolvedValue([
      {
        number: "1",
        name: "A",
        email: "a@x.pt",
        plan: "M",
        situation: "Em dia",
        dueDate: "—",
      },
    ]);
    quotaReports.overdueRows.mockResolvedValue([
      {
        number: "2",
        name: "B",
        email: "",
        plan: "M",
        daysOverdue: 3,
        dueDate: "01/01/2020",
      },
    ]);
    listPdf.generate.mockResolvedValue(Buffer.from("%PDF"));

    const r1 = res();
    await controller.payingPdf("org-1", r1 as never);
    expect(listPdf.generate).toHaveBeenCalled();
    expect(r1.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );

    const r2 = res();
    await controller.overduePdf("org-1", r2 as never);
    expect(r2.end).toHaveBeenCalled();
  });

  it("payingCsv e overdueCsv usam ponto-e-virgula", async () => {
    quotaReports.payingRows.mockResolvedValue([
      {
        number: "1",
        name: "A",
        email: "a",
        phone: "",
        plan: "M",
        situation: "Em dia",
        dueDate: "—",
      },
    ]);
    quotaReports.overdueRows.mockResolvedValue([
      {
        number: "2",
        name: "B",
        email: "",
        phone: "",
        plan: "M",
        daysOverdue: 1,
        dueDate: "x",
      },
    ]);

    const r1 = res();
    await controller.payingCsv("org-1", r1 as never);
    expect(String(r1.end.mock.calls[0]![0])).toContain(";");

    const r2 = res();
    await controller.overdueCsv("org-1", r2 as never);
    expect(r2.end).toHaveBeenCalled();
  });
});
