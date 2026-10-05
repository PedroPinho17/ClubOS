import { describe, expect, it, vi } from "vitest";
import { emptyImportResult } from "./member-import.types";
import { ImportPaymentUpsertService } from "./import-payment-upsert";

describe("ImportPaymentUpsertService", () => {
  const prisma = {
    member: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  };
  const service = new ImportPaymentUpsertService(prisma as never);

  it("importForMember nao faz nada sem dados de pagamento", async () => {
    const tx = {
      payment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    };
    const result = emptyImportResult();
    await service.importForMember(
      tx as never,
      "org-1",
      { id: "m1", quotaPlanId: null } as never,
      { nome: "Ana" } as never,
      result,
    );
    expect(tx.payment.findFirst).not.toHaveBeenCalled();
    expect(result.payments).toBe(0);
  });

  it("importForMember cria pagamento novo", async () => {
    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "p1" }),
        update: vi.fn(),
      },
    };
    const result = emptyImportResult();
    await service.importForMember(
      tx as never,
      "org-1",
      { id: "m1", quotaPlanId: "plan-1" } as never,
      {
        pagamento_valor: "10",
        pagamento_data: "2026-01-15",
        pagamento_referencia: "2026-01",
      } as never,
      result,
    );
    expect(tx.payment.create).toHaveBeenCalled();
    expect(result.payments).toBe(1);
  });

  it("importForMember actualiza pagamento existente", async () => {
    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({ id: "p-old" }),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "p-old" }),
      },
    };
    const result = emptyImportResult();
    await service.importForMember(
      tx as never,
      "org-1",
      { id: "m1", quotaPlanId: null } as never,
      {
        pagamento_valor: "12",
        pagamento_data: "2026-02-01",
        pagamento_referencia: "2026-02",
      } as never,
      result,
    );
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p-old" } }),
    );
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it("importPaymentOnlyRow exige numero", async () => {
    const result = emptyImportResult();
    await service.importPaymentOnlyRow(
      "org-1",
      { pagamento_valor: "10" } as never,
      3,
      new Map(),
      result,
      false,
      vi.fn(),
    );
    expect(result.errors[0]?.message).toMatch(/número/i);
    expect(result.skipped).toBe(1);
  });

  it("importPaymentOnlyRow dry-run chama simulatePayment", async () => {
    const member = { id: "m1", number: "7", quotaPlanId: null } as never;
    prisma.member.findFirst.mockResolvedValue(member);
    const simulate = vi.fn().mockResolvedValue(undefined);
    const result = emptyImportResult();
    const session = new Map();

    await service.importPaymentOnlyRow(
      "org-1",
      {
        numero: "7",
        pagamento_valor: "10",
        pagamento_data: "2026-01-01",
      } as never,
      4,
      session,
      result,
      true,
      simulate,
    );

    expect(simulate).toHaveBeenCalled();
    expect(session.get("7")).toEqual(member);
  });

  it("importPaymentOnlyRow falha se socio nao existe", async () => {
    prisma.member.findFirst.mockResolvedValue(null);
    const result = emptyImportResult();
    await service.importPaymentOnlyRow(
      "org-1",
      {
        numero: "99",
        pagamento_valor: "5",
        pagamento_data: "2026-01-01",
      } as never,
      5,
      new Map(),
      result,
      false,
      vi.fn(),
    );
    expect(result.errors[0]?.message).toMatch(/não encontrado/i);
  });
});
