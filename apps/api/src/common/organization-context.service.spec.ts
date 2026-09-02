import { ForbiddenException } from "@nestjs/common";
import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVE_ORG_COOKIE,
  OrganizationContextService,
} from "./organization-context.service";
import type { AuthUser } from "./types";

function mockRequest(
  user: AuthUser,
  headers: Record<string, string> = {},
): Request {
  return { user, headers } as Request;
}

describe("OrganizationContextService", () => {
  const prisma = {
    member: { findFirst: vi.fn() },
    organizationMember: { findMany: vi.fn(), findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
    session: { findUnique: vi.fn(), updateMany: vi.fn() },
  };

  const hostOrgs = {
    resolveFromRequest: vi.fn().mockResolvedValue(null),
  };

  let service: OrganizationContextService;

  beforeEach(() => {
    vi.resetAllMocks();
    hostOrgs.resolveFromRequest.mockResolvedValue(null);
    service = new OrganizationContextService(
      prisma as never,
      hostOrgs as never,
    );
  });

  it("socio usa organizacao do Member (ignora header)", async () => {
    prisma.member.findFirst.mockResolvedValue({ organizationId: "org-socio" });

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest(
        { id: "u1", role: "socio", email: "s@test", name: "S" },
        { "x-organization-id": "org-spoof" },
      ),
    );

    expect(orgId).toBe("org-socio");
  });

  it("staff usa header com prioridade sobre cookie e sessao", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([
      { organizationId: "org-a" },
      { organizationId: "org-b" },
    ]);

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest(
        { id: "u1", role: "administrador", email: "a@test", name: "A" },
        {
          "x-organization-id": "org-b",
          cookie: `${ACTIVE_ORG_COOKIE}=org-a`,
        },
      ),
    );

    expect(orgId).toBe("org-b");
  });

  it("staff rejeita org sem membership", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([
      { organizationId: "org-a" },
    ]);

    await expect(
      service.resolveActiveOrganizationId(
        mockRequest(
          { id: "u1", role: "tesoureiro", email: "t@test", name: "T" },
          { "x-organization-id": "org-other" },
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("imperador acede a org sem membership se existir", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organization.findUnique.mockResolvedValue({ id: "org-x" });

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest(
        { id: "u1", role: "imperador", email: "i@test", name: "I" },
        { "x-organization-id": "org-x" },
      ),
    );

    expect(orgId).toBe("org-x");
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { id: "org-x" },
      select: { id: true },
    });
  });

  it("imperador rejeita org inexistente", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveActiveOrganizationId(
        mockRequest(
          { id: "u1", role: "imperador", email: "i@test", name: "I" },
          { "x-organization-id": "org-missing" },
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("staff sem memberships falha", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([]);

    await expect(
      service.resolveActiveOrganizationId(
        mockRequest({
          id: "u1",
          role: "administrador",
          email: "a@test",
          name: "A",
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("staff em dominio custom ignora header e usa a org do host", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "org-vale",
      domain: "www.crcvale.pt",
    });
    prisma.organizationMember.findMany.mockResolvedValue([
      { organizationId: "org-vale" },
      { organizationId: "org-fit" },
    ]);

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest(
        { id: "u1", role: "administrador", email: "a@test", name: "A" },
        { "x-organization-id": "org-fit" },
      ),
    );

    expect(orgId).toBe("org-vale");
  });

  it("staff de outro clube no dominio custom e rejeitado", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "org-vale",
      domain: "www.crcvale.pt",
    });
    prisma.organizationMember.findMany.mockResolvedValue([
      { organizationId: "org-fit" },
    ]);

    await expect(
      service.resolveActiveOrganizationId(
        mockRequest({
          id: "u1",
          role: "tesoureiro",
          email: "t@test",
          name: "T",
        }),
      ),
    ).rejects.toThrow(/nao pertence a este clube/);
  });

  it("socio no dominio de outro clube e rejeitado", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "org-vale",
      domain: "www.crcvale.pt",
    });
    prisma.member.findFirst.mockResolvedValue({ organizationId: "org-fit" });

    await expect(
      service.resolveActiveOrganizationId(
        mockRequest({ id: "u1", role: "socio", email: "s@test", name: "S" }),
      ),
    ).rejects.toThrow(/nao pertence a este clube/);
  });

  it("imperador pode trocar de org num dominio custom", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "org-vale",
      domain: "www.crcvale.pt",
    });
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organization.findUnique.mockResolvedValue({ id: "org-fit" });

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest(
        { id: "u1", role: "imperador", email: "i@test", name: "I" },
        { "x-organization-id": "org-fit" },
      ),
    );

    expect(orgId).toBe("org-fit");
  });

  it("imperador sem header usa a org do host", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "org-vale",
      domain: "www.crcvale.pt",
    });
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organization.findUnique.mockResolvedValue({ id: "org-vale" });

    const orgId = await service.resolveActiveOrganizationId(
      mockRequest({ id: "u1", role: "imperador", email: "i@test", name: "I" }),
    );

    expect(orgId).toBe("org-vale");
  });
});
