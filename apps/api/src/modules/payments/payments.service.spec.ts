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
  });
});
