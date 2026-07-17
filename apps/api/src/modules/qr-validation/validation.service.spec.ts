import { NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@clubos/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationService } from "./validation.service";

vi.mock("../reminders/org-reminder-settings", () => ({
  loadOrgReminderSettings: vi.fn().mockResolvedValue({ diasAvisoQuota: 7 }),
}));

describe("ValidationService", () => {
  const prisma = {
    member: { findUnique: vi.fn() },
    organizationModule: { findFirst: vi.fn() },
  };

  const service = new ValidationService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita socio inexistente", async () => {
    prisma.member.findUnique.mockResolvedValue(null);

    await expect(service.validate("missing")).rejects.toThrow(
      new NotFoundException("Cartao invalido ou socio inexistente."),
    );
  });

  it("rejeita quando o modulo qr-validation esta desligado", async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: "mem-1",
      organizationId: "org-1",
      name: "Ana",
      number: "1",
      status: "ACTIVE",
      joinedAt: new Date("2025-01-01"),
      cardValidUntil: null,
      organization: { name: "CRC", primaryColor: "#000" },
      quotaPlan: null,
      payments: [],
    });
    prisma.organizationModule.findFirst.mockResolvedValue(null);

    await expect(service.validate("mem-1")).rejects.toThrow(
      new NotFoundException("Validacao indisponivel para esta organizacao."),
    );
  });

  it("devolve resultado publico seguro quando o cartao e valido", async () => {
    prisma.member.findUnique.mockResolvedValue({
      id: "mem-1",
      organizationId: "org-1",
      name: "Ana Silva",
      number: "42",
      status: "ACTIVE",
      joinedAt: new Date("2025-01-15T00:00:00.000Z"),
      cardValidUntil: new Date("2026-12-31T00:00:00.000Z"),
      organization: { name: "CRC Vale", primaryColor: "#123456" },
      quotaPlan: {
        periodicity: "MONTHLY",
      },
      payments: [
        {
          paidAt: new Date("2026-07-01T00:00:00.000Z"),
          status: PaymentStatus.PAID,
        },
      ],
    });
    prisma.organizationModule.findFirst.mockResolvedValue({ enabled: true });

    const result = await service.validate("mem-1");

    expect(result.organization).toEqual({
      name: "CRC Vale",
      primaryColor: "#123456",
    });
    expect(result.member).toEqual({
      name: "Ana Silva",
      number: "42",
      active: true,
    });
    expect(result.validUntil).toBe(
      new Date("2026-12-31T00:00:00.000Z").toISOString(),
    );
    expect(result.status).toBeTruthy();
    expect(typeof result.checkedAt).toBe("string");
    expect(prisma.organizationModule.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        module: { slug: "qr-validation" },
        enabled: true,
      },
    });
  });
});
