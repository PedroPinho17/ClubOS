import { describe, expect, it, vi } from "vitest";
import { ImportDryRunService } from "./import-dry-run";
import { emptyImportResult } from "./member-import.types";

describe("ImportDryRunService", () => {
  const prisma = {
    payment: { findFirst: vi.fn() },
  };
  const memberUpsert = {
    nextNumber: vi.fn().mockResolvedValue("8"),
  };
  const service = new ImportDryRunService(
    prisma as never,
    memberUpsert as never,
  );

  it("simulateMemberRow cria membro dry- e conta created", async () => {
    const result = emptyImportResult();
    const session = new Map();
    const member = await service.simulateMemberRow(
      "org-1",
      null,
      {
        name: "Ana",
        email: "a@x.pt",
        phone: null,
        joinedAt: new Date("2024-01-01"),
        cardRole: null,
        cardValidUntil: null,
        status: "ACTIVE",
        notes: null,
        quotaPlanId: null,
        number: undefined,
      },
      {} as never,
      session,
      result,
    );

    expect(member.id).toBe("dry-8");
    expect(result.created).toBe(1);
    expect(session.get("8")).toBe(member);
  });

  it("simulateMemberRow actualiza existente e pagamento", async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    const result = emptyImportResult();
    const existing = {
      id: "m1",
      number: "3",
      name: "Old",
      email: null,
      phone: null,
      joinedAt: new Date(),
      cardRole: null,
      cardValidUntil: null,
      status: "ACTIVE",
      notes: null,
      photoKey: null,
      userId: null,
      quotaPlanId: "p1",
      organizationId: "org-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const session = new Map();

    await service.simulateMemberRow(
      "org-1",
      existing as never,
      {
        name: "New",
        email: "n@x.pt",
        phone: "912",
        joinedAt: existing.joinedAt,
        cardRole: null,
        cardValidUntil: null,
        status: "ACTIVE",
        notes: null,
        quotaPlanId: "p1",
        number: "3",
      },
      {
        pagamento_valor: "10",
        pagamento_data: "2026-01-10",
        pagamento_referencia: "2026-01",
      } as never,
      session,
      result,
    );

    expect(result.updated).toBe(1);
    expect(result.payments).toBe(1);
    expect(prisma.payment.findFirst).toHaveBeenCalled();
  });

  it("simulatePaymentForMember ignora sem dados de pagamento", async () => {
    const result = emptyImportResult();
    await service.simulatePaymentForMember(
      "org-1",
      { id: "m1" } as never,
      { nome: "X" } as never,
      result,
    );
    expect(result.payments).toBe(0);
  });
});
