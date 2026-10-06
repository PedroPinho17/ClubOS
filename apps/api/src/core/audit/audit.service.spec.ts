import { describe, expect, it, vi } from "vitest";
import { AuditService } from "./audit.service";

describe("AuditService", () => {
  const prisma = {
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };
  const service = new AuditService(prisma as never);

  it("list limita a 500", async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    await service.list("org-1", 999);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-1" },
        take: 500,
      }),
    );
  });

  it("log grava entrada", async () => {
    prisma.auditLog.create.mockResolvedValue({});
    await service.log({
      organizationId: "o1",
      userId: "u1",
      action: "member.created",
      entity: "Member",
      entityId: "m1",
      meta: { x: 1 },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "member.created",
          entityId: "m1",
        }),
      }),
    );
  });
});
