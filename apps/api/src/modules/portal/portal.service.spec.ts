import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@clubos/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../auth/auth";
import { PortalService } from "./portal.service";

vi.mock("../../auth/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
    },
  },
}));

const memberBase = {
  id: "mem-1",
  organizationId: "org-1",
  number: "42",
  name: "Maria Portal",
  email: "maria@clube.pt",
  phone: "912000000",
  joinedAt: new Date("2025-01-15T00:00:00.000Z"),
  status: "ACTIVE" as const,
  photoKey: null,
  notes: null,
  cardRole: null,
  cardValidUntil: null,
  userId: "user-1",
  quotaPlanId: "plan-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  quotaPlan: {
    id: "plan-1",
    organizationId: "org-1",
    name: "Quota mensal",
    amount: { toString: () => "15" },
    periodicity: "MONTHLY" as const,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  payments: [
    {
      id: "pay-1",
      organizationId: "org-1",
      memberId: "mem-1",
      quotaPlanId: "plan-1",
      amount: { toString: () => "15" },
      method: "CASH" as const,
      status: PaymentStatus.PAID,
      reference: "2026-01",
      receiptKey: null,
      paidAt: new Date("2026-01-10T00:00:00.000Z"),
      createdAt: new Date("2026-01-10T00:00:00.000Z"),
      updatedAt: new Date(),
    },
  ],
};

describe("PortalService", () => {
  const prisma = {
    member: { findFirst: vi.fn(), update: vi.fn() },
    payment: { findFirst: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    organizationSetting: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const cards = { getCardData: vi.fn() };
  const mail = { send: vi.fn() };
  const payments = { getReceipt: vi.fn() };
  const storage = { getUrl: vi.fn() };

  const service = new PortalService(
    prisma as never,
    cards as never,
    mail as never,
    payments as never,
    storage as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mail.send.mockResolvedValue(undefined);
    storage.getUrl.mockResolvedValue("https://cdn.example/logo.png");
  });

  describe("getOrganizationBranding", () => {
    it("devolve nome e cor para socio com member", async () => {
      prisma.member.findFirst.mockResolvedValue({ organizationId: "org-1" });
      prisma.organization.findUnique.mockResolvedValue({
        id: "org-1",
        name: "CRC Vale",
        logoKey: "orgs/org-1/logo.png",
        primaryColor: "#1d4ed8",
      });

      const result = await service.getOrganizationBranding("user-1");

      expect(result).toEqual({
        id: "org-1",
        name: "CRC Vale",
        primaryColor: "#1d4ed8",
        logoUrl: "https://cdn.example/logo.png",
      });
      expect(storage.getUrl).toHaveBeenCalledWith("orgs/org-1/logo.png");
    });

    it("logoUrl fica null sem logoKey", async () => {
      prisma.member.findFirst.mockResolvedValue({ organizationId: "org-1" });
      prisma.organization.findUnique.mockResolvedValue({
        id: "org-1",
        name: "CRC Vale",
        logoKey: null,
        primaryColor: "#1d4ed8",
      });

      const result = await service.getOrganizationBranding("user-1");

      expect(result.logoUrl).toBeNull();
      expect(storage.getUrl).not.toHaveBeenCalled();
    });

    it("rejeita user sem socio associado", async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.getOrganizationBranding("user-x")).rejects.toThrow(
        new NotFoundException("Socio nao encontrado."),
      );
    });
  });

  describe("getMe", () => {
    it("devolve dados do socio, quota e pagamentos", async () => {
      prisma.member.findFirst.mockResolvedValue(memberBase);
      cards.getCardData.mockResolvedValue({
        layout: "crc_vale",
        memberName: "Maria Portal",
      });

      const result = await service.getMe("user-1");

      expect(result.member.name).toBe("Maria Portal");
      expect(result.member.planName).toBe("Quota mensal");
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].amount).toBe("15.00");
      expect(result.card).toEqual({
        layout: "crc_vale",
        memberName: "Maria Portal",
      });
    });

    it("card fica null quando o modulo de cartoes falha", async () => {
      prisma.member.findFirst.mockResolvedValue(memberBase);
      cards.getCardData.mockRejectedValue(new Error("modulo inactivo"));

      const result = await service.getMe("user-1");

      expect(result.card).toBeNull();
    });

    it("rejeita conta sem socio associado", async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.getMe("user-x")).rejects.toThrow(
        new NotFoundException(
          "A sua conta ainda nao esta associada a um socio.",
        ),
      );
    });
  });

  describe("getReceipt", () => {
    it("devolve PDF de pagamento pago do proprio socio", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "mem-1",
        organizationId: "org-1",
      });
      prisma.payment.findFirst.mockResolvedValue({
        id: "pay-1",
        status: PaymentStatus.PAID,
      });
      payments.getReceipt.mockResolvedValue({
        filename: "recibo.pdf",
        buffer: Buffer.from("pdf"),
      });

      const result = await service.getReceipt("user-1", "pay-1");

      expect(payments.getReceipt).toHaveBeenCalledWith("org-1", "pay-1");
      expect(result.filename).toBe("recibo.pdf");
    });

    it("rejeita pagamento pendente", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "mem-1",
        organizationId: "org-1",
      });
      prisma.payment.findFirst.mockResolvedValue({
        id: "pay-2",
        status: PaymentStatus.PENDING,
      });

      await expect(service.getReceipt("user-1", "pay-2")).rejects.toThrow(
        new BadRequestException(
          "Recibo disponivel apenas para pagamentos concluidos.",
        ),
      );
    });

    it("rejeita pagamento inexistente", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "mem-1",
        organizationId: "org-1",
      });
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.getReceipt("user-1", "pay-x")).rejects.toThrow(
        new NotFoundException("Pagamento nao encontrado."),
      );
    });
  });

  describe("grantAccess", () => {
    const memberWithoutAccess = {
      id: "mem-2",
      organizationId: "org-1",
      name: "Joao Novo",
      email: "joao@clube.pt",
      userId: null,
    };

    it("cria conta, associa socio e envia email", async () => {
      prisma.member.findFirst.mockResolvedValue(memberWithoutAccess);
      prisma.organization.findUnique.mockResolvedValue({
        name: "CRC Vale",
        primaryColor: "#1d4ed8",
        logoUrl: null,
      });
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "user-new", email: "joao@clube.pt" });
      vi.mocked(auth.api.signUpEmail).mockResolvedValue(undefined as never);

      const result = await service.grantAccess("org-1", "mem-2", "MinhaPass8!");

      expect(result.email).toBe("joao@clube.pt");
      expect(result.mustChangePassword).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-new" },
        data: { role: "socio", emailVerified: true, mustChangePassword: true },
      });
      expect(prisma.member.update).toHaveBeenCalledWith({
        where: { id: "mem-2" },
        data: { userId: "user-new" },
      });
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "joao@clube.pt",
          subject: "Acesso ao Portal do Sócio",
          html: expect.stringContaining("joao@clube.pt"),
        }),
      );
    });

    it("rejeita socio sem email", async () => {
      prisma.member.findFirst.mockResolvedValue({
        ...memberWithoutAccess,
        email: null,
      });

      await expect(
        service.grantAccess("org-1", "mem-2", "MinhaPass8!"),
      ).rejects.toThrow(
        new BadRequestException("O socio nao tem email definido."),
      );
    });

    it("rejeita socio que ja tem acesso", async () => {
      prisma.member.findFirst.mockResolvedValue({
        ...memberWithoutAccess,
        userId: "user-existing",
      });

      await expect(
        service.grantAccess("org-1", "mem-2", "MinhaPass8!"),
      ).rejects.toThrow(
        new BadRequestException("Este socio ja tem acesso ao portal."),
      );
    });

    it("rejeita socio inexistente", async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.grantAccess("org-1", "mem-x", "MinhaPass8!"),
      ).rejects.toThrow(new NotFoundException("Socio nao encontrado."));
    });
  });
});
