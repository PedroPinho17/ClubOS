import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSpreadsheetBuffer } from "./member-spreadsheet";
import { MemberImportService } from "./member-import.service";

describe("MemberImportService", () => {
  const prisma = {
    quotaPlan: { findMany: vi.fn() },
    member: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  };
  const memberUpsert = { upsert: vi.fn() };
  const paymentUpsert = {
    importForMember: vi.fn(),
    importPaymentOnlyRow: vi.fn(),
  };
  const dryRun = {
    simulateMemberRow: vi.fn(),
    simulatePaymentForMember: vi.fn(),
  };

  const service = new MemberImportService(
    prisma as never,
    memberUpsert as never,
    paymentUpsert as never,
    dryRun as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.quotaPlan.findMany.mockResolvedValue([
      { id: "plan-1", name: "Mensal" },
    ]);
  });

  it("rejeita ficheiro > 10 MB", async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1);
    const result = await service.importFromBuffer("org-1", big);
    expect(result.errors[0]?.message).toMatch(/10 MB/i);
  });

  it("rejeita .xlsx invalido", async () => {
    const result = await service.importFromBuffer(
      "org-1",
      Buffer.from("nao-e-excel"),
    );
    expect(result.errors[0]?.message).toMatch(/xlsx|invalido|corrompido/i);
  });

  it("rejeita cabecalho sem identidade", async () => {
    const buf = await buildSpreadsheetBuffer([
      ["Email", "Telefone"],
      ["a@x.pt", "912"],
    ]);
    const result = await service.importFromBuffer("org-1", buf);
    expect(result.errors[0]?.message).toMatch(/Cabeçalho inválido/i);
  });

  it("dry-run simula socio novo", async () => {
    const buf = await buildSpreadsheetBuffer([
      ["Nome", "Número", "Email", "Data de adesão"],
      ["Ana Silva", "1", "ana@x.pt", "15/01/2025"],
    ]);
    dryRun.simulateMemberRow.mockImplementation(
      async (_o, _e, _p, _d, session, result) => {
        const m = {
          id: "dry-1",
          number: "1",
          name: "Ana Silva",
        };
        session.set("1", m);
        result.created++;
        return m;
      },
    );

    const result = await service.importFromBuffer("org-1", buf, true, true);

    expect(result.dryRun).toBe(true);
    expect(result.created).toBe(1);
    expect(result.errors).toEqual([]);
    expect(dryRun.simulateMemberRow).toHaveBeenCalled();
    expect(memberUpsert.upsert).not.toHaveBeenCalled();
  });

  it("skip socio existente quando updateExisting=false", async () => {
    const buf = await buildSpreadsheetBuffer([
      ["Nome", "Número", "Data de adesão"],
      ["Ana", "5", "01/01/2025"],
    ]);
    prisma.member.findFirst.mockResolvedValue({
      id: "m5",
      number: "5",
      name: "Ana",
    });

    const result = await service.importFromBuffer("org-1", buf, false, false);

    expect(result.skipped).toBe(1);
    expect(result.errors).toEqual([]);
    expect(memberUpsert.upsert).not.toHaveBeenCalled();
  });

  it("grava socio novo em transacao", async () => {
    const buf = await buildSpreadsheetBuffer([
      ["Nome", "Número", "Email", "Data de adesão"],
      ["Bruno", "2", "b@x.pt", "01/02/2025"],
    ]);
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn) => fn({}));
    memberUpsert.upsert.mockResolvedValue({
      id: "m2",
      number: "2",
      name: "Bruno",
    });
    paymentUpsert.importForMember.mockResolvedValue(undefined);

    const result = await service.importFromBuffer("org-1", buf, true, false);

    expect(result.created).toBe(1);
    expect(result.errors).toEqual([]);
    expect(memberUpsert.upsert).toHaveBeenCalled();
    expect(paymentUpsert.importForMember).toHaveBeenCalled();
  });

  it("linha sem nome e skipada com erro", async () => {
    // Email preenchido evita caminho "payment-only" (so numero + nome vazio)
    const buf = await buildSpreadsheetBuffer([
      ["Nome", "Número", "Email", "Data de adesão"],
      ["", "9", "x@y.pt", "01/01/2025"],
    ]);
    const result = await service.importFromBuffer("org-1", buf);
    expect(result.skipped).toBe(1);
    expect(result.errors[0]?.message).toMatch(/nome/i);
  });
});
