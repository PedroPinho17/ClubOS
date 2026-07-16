import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembersService } from "./members.service";

vi.mock("../reminders/org-reminder-settings", () => ({
  loadOrgReminderSettings: vi.fn().mockResolvedValue({ diasAvisoQuota: 7 }),
}));

vi.mock("./quota.util", () => ({
  computeQuotaSituation: vi.fn().mockReturnValue({
    status: "up_to_date",
    label: "Em dia",
  }),
}));

describe("MembersService (org scoping)", () => {
  const prisma = {
    member: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  };
  const storage = {
    getUrl: vi.fn().mockResolvedValue(null),
    putObject: vi.fn(),
    deleteObject: vi.fn(),
  };

  const service = new MembersService(prisma as never, storage as never);

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getUrl.mockResolvedValue(null);
  });

  describe("list", () => {
    it("filtra sempre por organizationId", async () => {
      prisma.member.count.mockResolvedValue(0);
      prisma.member.findMany.mockResolvedValue([]);

      await service.list("org-1", { page: 1, limit: 10 });

      expect(prisma.member.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ organizationId: "org-1" }),
      });
      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "org-1" }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("procura por id + organizationId", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        organizationId: "org-1",
        photoKey: null,
        quotaPlan: null,
        payments: [],
        joinedAt: new Date(),
        cardValidUntil: null,
      });

      await service.findOne("org-1", "m1");

      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: { id: "m1", organizationId: "org-1" },
        include: expect.any(Object),
      });
    });

    it("lança NotFoundException se o membro for de outra org", async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.findOne("org-2", "m1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("persiste com organizationId", async () => {
      prisma.$queryRaw.mockResolvedValue([{ max: null }]);
      prisma.member.create.mockResolvedValue({
        id: "m-new",
        organizationId: "org-1",
        number: "1",
        name: "Ana",
      });

      await service.create("org-1", { name: "Ana" });

      expect(prisma.member.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org-1",
            name: "Ana",
          }),
        }),
      );
    });
  });

  describe("update / remove", () => {
    it("update usa updateMany com id + organizationId", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        organizationId: "org-1",
        photoKey: null,
        quotaPlan: null,
        payments: [],
        joinedAt: new Date(),
        cardValidUntil: null,
      });
      prisma.member.updateMany.mockResolvedValue({ count: 1 });

      await service.update("org-1", "m1", { name: "Ana Actualizada" });

      expect(prisma.member.updateMany).toHaveBeenCalledWith({
        where: { id: "m1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "Ana Actualizada" }),
      });
    });

    it("remove usa deleteMany com id + organizationId", async () => {
      prisma.member.findFirst.mockResolvedValue({
        id: "m1",
        organizationId: "org-1",
        photoKey: null,
        quotaPlan: null,
        payments: [],
        joinedAt: new Date(),
        cardValidUntil: null,
      });
      prisma.member.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove("org-1", "m1");

      expect(prisma.member.deleteMany).toHaveBeenCalledWith({
        where: { id: "m1", organizationId: "org-1" },
      });
    });
  });
});
