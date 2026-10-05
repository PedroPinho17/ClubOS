import { describe, expect, it } from "vitest";
import { ReceiptService } from "./receipt.service";

describe("ReceiptService", () => {
  const service = new ReceiptService();

  it("gera PDF A4 com cabecalho e valor", async () => {
    const buf = await service.generate({
      organizationName: "CRC Vale",
      organizationColor: "#1E3A5F",
      receiptNumber: "R-100",
      date: new Date("2026-03-15T12:00:00.000Z"),
      memberName: "Ana Silva",
      memberNumber: "42",
      planName: "Mensal",
      amount: 15.5,
      method: "CASH",
      status: "PAID",
    });

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(500);
  });

  it("aceita cor invalida e plano/metodo/estado desconhecidos", async () => {
    const buf = await service.generate({
      organizationName: "Clube",
      organizationColor: "not-a-hex",
      receiptNumber: "1",
      date: new Date("2026-01-01"),
      memberName: "X",
      memberNumber: "1",
      planName: null,
      amount: 0,
      method: "CRYPTO",
      status: "WEIRD",
    });

    expect(buf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("gera PDF sem cor de organizacao (fallback)", async () => {
    const buf = await service.generate({
      organizationName: "Sem Cor",
      receiptNumber: "R-2",
      date: new Date(),
      memberName: "B",
      memberNumber: "2",
      amount: 10,
      method: "MBWAY",
      status: "PENDING",
    });

    expect(buf.length).toBeGreaterThan(400);
  });
});
