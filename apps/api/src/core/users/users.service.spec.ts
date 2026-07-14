import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersService } from "./users.service";

describe("UsersService.invite", () => {
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    organizationMember: { upsert: vi.fn() },
  };
  const mail = { send: vi.fn() };
  const audit = { log: vi.fn() };

  let service: UsersService;

  const orgId = "org-1";
  const actorId = "actor-1";
  const dto = {
    name: "Novo Staff",
    email: "novo@test.clubos.local",
    role: "tesoureiro" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UsersService(prisma as never, mail as never, audit as never);
  });

  it("administrador so pode convidar tesoureiro", async () => {
    await expect(
      service.invite(orgId, "administrador", actorId, {
        ...dto,
        role: "administrador",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("tesoureiro nao pode convidar", async () => {
    await expect(
      service.invite(orgId, "tesoureiro", actorId, dto),
    ).rejects.toThrow(ForbiddenException);
  });

  it("admin nao pode convidar user de outra org", async () => {
    prisma.user.findUnique.mockResolvedValue({
      role: "tesoureiro",
      member: null,
      organizationMemberships: [{ organizationId: "org-other" }],
    });

    await expect(
      service.invite(orgId, "administrador", actorId, dto),
    ).rejects.toThrow(BadRequestException);
  });
});
