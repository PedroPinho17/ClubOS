import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PaymentStatus } from "@clubos/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentsService } from "./payments.service";

describe("PaymentsService (org scoping)", () => {
  const prisma = {
    payment: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    member: { findFirst: vi.fn() },
    quotaPlan: { findFirst: vi.fn() },
    organization: { findUnique: vi.fn() },
  };
  const receipts = { generate: vi.fn() };
  const receiptQueue = {
    enqueue: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn(),
  };
  const redis = {
    getBuffer: vi.fn(),
    set: vi.fn(),
  };

  const service = new PaymentsService(
    prisma as never,
    receipts as never,
    receiptQueue as never,
    redis as never,
  );

  const paidPayment = {
    id: "pay-abcdef12",
    organizationId: "org-1",
    reference: "2026-01",
    paidAt: new Date("2026-01-15"),
    createdAt: new Date("2026-01-14"),
    amount: 15,
    method: "CASH",
    status: PaymentStatus.PAID,
    member: { name: "Ana", number: "1" },
    quotaPlan: { name: "Mensal" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    receiptQueue.enqueue.mockResolvedValue(undefined);
  });

  describe("list", () => {
    it("filtra count e findMany por organizationId", async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findMany.mockResolvedValue([]);

      await service.list("org-1", { page: 1, limit: 20 });

      expect(prisma.payment.count).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
      });
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-1" },
        }),
      );
    });
  });

  describe("findOne", () => {
    it("procura por id + organizationId", async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: "p1",
        organizationId: "org-1",
      });

      await service.findOne("org-1", "p1");

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { id: "p1", organizationId: "org-1" },
        include: expect.any(Object),
      });
    });

    it("lança NotFoundException se for de outra org", async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.findOne("org-2", "p1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("rejeita membro de outra organização", async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.create("org-1", {
          memberId: "m-other",
          amount: 10,
          method: "CASH",
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: { id: "m-other", organizationId: "org-1" },
      });
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it("cria pagamento com organizationId do tenant", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        organizationId: "org-1",
        quotaPlanId: "plan-1",
      });
      prisma.payment.create.mockResolvedValue({
        id: "p-new",
        organizationId: "org-1",
        memberId: "m1",
        status: PaymentStatus.PAID,
      });

      await service.create("org-1", {
        memberId: "m1",
        amount: 15,
        method: "CASH",
      } as never);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org-1",
            memberId: "m1",
            amount: 15,
          }),
        }),
      );
    });

    it("resolve valor a partir do plano quando amount falta", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        quotaPlanId: "plan-1",
      });
      prisma.quotaPlan.findFirst.mockResolvedValue({
        id: "plan-1",
        amount: 25,
      });
      prisma.payment.create.mockResolvedValue({
        id: "p2",
        status: PaymentStatus.PAID,
      });

      await service.create("org-1", {
        memberId: "m1",
        method: "TRANSFER",
      } as never);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 25 }),
        }),
      );
    });

    it("rejeita quando nao ha valor nem plano", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        quotaPlanId: null,
      });

      await expect(
        service.create("org-1", {
          memberId: "m1",
          method: "CASH",
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("nao enfileira recibo quando status nao e PAID", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        quotaPlanId: null,
      });
      prisma.payment.create.mockResolvedValue({
        id: "p3",
        status: PaymentStatus.PENDING,
      });

      await service.create("org-1", {
        memberId: "m1",
        amount: 10,
        method: "CASH",
        status: PaymentStatus.PENDING,
      } as never);

      expect(receiptQueue.enqueue).not.toHaveBeenCalled();
    });
  });

  describe("receipt cache", () => {
    it("getCachedReceipt e cacheReceipt usam Redis", async () => {
      redis.getBuffer.mockResolvedValue(Buffer.from("%PDF"));
      const buf = await service.getCachedReceipt("p1");
      expect(buf?.toString()).toBe("%PDF");

      await service.cacheReceipt("p1", Buffer.from("x"));
      expect(redis.set).toHaveBeenCalled();
    });

    it("getReceiptStatus delega na queue", async () => {
      receiptQueue.getStatus.mockResolvedValue("completed");
      await expect(service.getReceiptStatus("p1")).resolves.toBe("completed");
    });

    it("getReceipt serve do cache quando existe", async () => {
      prisma.payment.findFirst.mockResolvedValue(paidPayment);
      redis.getBuffer.mockResolvedValue(Buffer.from("%PDF-cached"));

      const out = await service.getReceipt("org-1", paidPayment.id);
      expect(out.filename).toBe("recibo-2026-01.pdf");
      expect(out.buffer.toString()).toBe("%PDF-cached");
      expect(receipts.generate).not.toHaveBeenCalled();
    });

    it("getReceipt gera e faz cache quando miss", async () => {
      prisma.payment.findFirst.mockResolvedValue(paidPayment);
      prisma.organization.findUnique.mockResolvedValue({
        name: "CRC",
        primaryColor: "#123",
      });
      redis.getBuffer.mockResolvedValue(null);
      receipts.generate.mockResolvedValue(Buffer.from("%PDF-new"));
      redis.set.mockResolvedValue("OK");

      const out = await service.getReceipt("org-1", paidPayment.id);
      expect(out.buffer.toString()).toBe("%PDF-new");
      expect(receipts.generate).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it("generateReceipt usa fallback de org e reference", async () => {
      prisma.payment.findFirst.mockResolvedValue({
        ...paidPayment,
        reference: null,
        id: "abcdefgh",
        quotaPlan: null,
      });
      prisma.organization.findUnique.mockResolvedValue(null);
      receipts.generate.mockResolvedValue(Buffer.from("%PDF"));

      const out = await service.generateReceipt("org-1", "abcdefgh");
      expect(out.filename).toMatch(/^recibo-/);
      expect(receipts.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationName: "Organizacao",
          planName: undefined,
        }),
      );
    });
  });
});
