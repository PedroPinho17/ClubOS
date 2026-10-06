import { describe, expect, it, vi } from "vitest";
import { PaymentsController } from "./payments.controller";

describe("PaymentsController", () => {
  const payments = {
    list: vi.fn(),
    findOne: vi.fn(),
    getReceipt: vi.fn(),
    getReceiptStatus: vi.fn(),
    create: vi.fn(),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const controller = new PaymentsController(payments as never, audit as never);

  it("list e findOne delegam", async () => {
    payments.list.mockResolvedValue({ items: [] });
    await controller.list("org-1", { page: 1 } as never);
    expect(payments.list).toHaveBeenCalledWith("org-1", { page: 1 });

    payments.findOne.mockResolvedValue({ id: "p1" });
    await controller.findOne("org-1", "p1");
    expect(payments.findOne).toHaveBeenCalledWith("org-1", "p1");
  });

  it("receipt escreve PDF", async () => {
    payments.getReceipt.mockResolvedValue({
      filename: "r.pdf",
      buffer: Buffer.from("%PDF"),
    });
    const res = { setHeader: vi.fn(), end: vi.fn() };
    await controller.receipt("org-1", "p1", res as never);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(res.end).toHaveBeenCalled();
  });
});
