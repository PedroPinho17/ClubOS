import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipPlansService } from "./membership-plans.service";

describe("MembershipPlansService", () => {
  const prisma = {
    quotaPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    member: { count: vi.fn() },
  };

  const service = new MembershipPlansService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista planos da organizacao", async () => {
    prisma.quotaPlan.findMany.mockResolvedValue([{ id: "p1" }]);
    await expect(service.list("org-1")).resolves.toEqual([{ id: "p1" }]);
    expect(prisma.quotaPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
  });

  it("findOne falha fora do tenant", async () => {
    prisma.quotaPlan.findFirst.mockResolvedValue(null);
    await expect(service.findOne("org-1", "p1")).rejects.toThrow(
      new NotFoundException("Plano nao encontrado."),
    );
  });

  it("remove desactiva quando ainda ha socios", async () => {
    prisma.quotaPlan.findFirst.mockResolvedValue({
      id: "p1",
      organizationId: "org-1",
    });
    prisma.member.count.mockResolvedValue(2);
    prisma.quotaPlan.update.mockResolvedValue({ id: "p1", active: false });

    await expect(service.remove("org-1", "p1")).resolves.toEqual({
      id: "p1",
      active: false,
    });
    expect(prisma.quotaPlan.delete).not.toHaveBeenCalled();
    expect(prisma.quotaPlan.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { active: false },
    });
  });

  it("remove apaga quando nao ha socios", async () => {
    prisma.quotaPlan.findFirst.mockResolvedValue({
      id: "p1",
      organizationId: "org-1",
    });
    prisma.member.count.mockResolvedValue(0);
    prisma.quotaPlan.delete.mockResolvedValue({});

    await expect(service.remove("org-1", "p1")).resolves.toEqual({
      success: true,
    });
    expect(prisma.quotaPlan.delete).toHaveBeenCalledWith({
      where: { id: "p1" },
    });
  });
});
