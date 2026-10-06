import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeService } from "./me.service";

describe("MeService", () => {
  const prisma = {
    member: { findFirst: vi.fn() },
    organizationMember: { findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    accountDeletionRequest: { findFirst: vi.fn(), create: vi.fn() },
  };
  const storage = { getUrl: vi.fn().mockResolvedValue(null) };
  const orgContext = {
    resolveActiveOrganizationId: vi.fn(),
    resolveEffectiveRole: vi.fn(),
    hasMembership: vi.fn(),
    setSessionActiveOrganization: vi.fn(),
  };
  const hostOrgs = { resolveFromRequest: vi.fn() };

  const service = new MeService(
    prisma as never,
    storage as never,
    orgContext as never,
    hostOrgs as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getUrl.mockResolvedValue("https://cdn/l.png");
  });

  it("getActiveContext", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "o1",
      domain: "x.pt",
    });
    orgContext.resolveActiveOrganizationId.mockResolvedValue("o1");
    orgContext.resolveEffectiveRole.mockResolvedValue("administrador");
    const out = await service.getActiveContext(
      { id: "u1", role: "administrador" } as never,
      {} as never,
    );
    expect(out).toMatchObject({
      organizationId: "o1",
      hostLocked: true,
      hostOrganizationId: "o1",
    });
  });

  it("listOrganizations para socio", async () => {
    prisma.member.findFirst.mockResolvedValue({
      organization: {
        id: "o1",
        name: "CRC",
        slug: "crc",
        plan: "FREE",
        status: "ACTIVE",
        primaryColor: "#000",
        logoKey: "k",
      },
    });
    const out = await service.listOrganizations({
      id: "u1",
      role: "socio",
    } as never);
    expect(out).toHaveLength(1);
    expect(out[0]?.orgRole).toBe("socio");
  });

  it("listOrganizations para staff", async () => {
    prisma.organizationMember.findMany.mockResolvedValue([
      {
        orgRole: "tesoureiro",
        organization: {
          id: "o1",
          name: "CRC",
          slug: "crc",
          plan: "FREE",
          status: "ACTIVE",
          primaryColor: "#000",
          logoKey: null,
        },
      },
    ]);
    const out = await service.listOrganizations({
      id: "u1",
      role: "tesoureiro",
    } as never);
    expect(out[0]?.orgRole).toBe("tesoureiro");
  });

  it("setActiveOrganization bloqueia socio noutra org", async () => {
    prisma.member.findFirst.mockResolvedValue({ organizationId: "o1" });
    await expect(
      service.setActiveOrganization({ id: "u1", role: "socio" } as never, "o2"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("setActiveOrganization bloqueia host mismatch", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue({
      organizationId: "o-host",
      domain: "h.pt",
    });
    await expect(
      service.setActiveOrganization(
        { id: "u1", role: "administrador" } as never,
        "o-other",
        "tok",
        {} as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("setActiveOrganization imperador exige org existente", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue(null);
    await expect(
      service.setActiveOrganization(
        { id: "u1", role: "imperador" } as never,
        "missing",
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("setActiveOrganization ok para staff com membership", async () => {
    hostOrgs.resolveFromRequest.mockResolvedValue(null);
    orgContext.hasMembership.mockResolvedValue(true);
    prisma.organization.findUnique.mockResolvedValue({
      id: "o1",
      name: "CRC",
    });
    orgContext.setSessionActiveOrganization.mockResolvedValue(undefined);
    await expect(
      service.setActiveOrganization(
        { id: "u1", role: "administrador" } as never,
        "o1",
        "sess",
      ),
    ).resolves.toEqual({ organizationId: "o1", name: "CRC" });
  });

  it("completePasswordChange", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      mustChangePassword: true,
    });
    prisma.user.update.mockResolvedValue({});
    await expect(service.completePasswordChange("u1")).resolves.toEqual({
      mustChangePassword: false,
    });
  });

  it("requestAccountDeletion reutiliza pedido pendente", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    prisma.member.findFirst.mockResolvedValue({ organizationId: "o1" });
    const createdAt = new Date("2026-01-01");
    prisma.accountDeletionRequest.findFirst.mockResolvedValue({
      id: "req1",
      status: "PENDING",
      createdAt,
    });
    const out = await service.requestAccountDeletion("u1");
    expect(out.id).toBe("req1");
    expect(prisma.accountDeletionRequest.create).not.toHaveBeenCalled();
  });

  it("requestAccountDeletion cria pedido", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.accountDeletionRequest.findFirst.mockResolvedValue(null);
    const createdAt = new Date("2026-02-01");
    prisma.accountDeletionRequest.create.mockResolvedValue({
      id: "req2",
      status: "PENDING",
      createdAt,
    });
    const out = await service.requestAccountDeletion("u1", " privacy ");
    expect(out.id).toBe("req2");
    expect(prisma.accountDeletionRequest.create).toHaveBeenCalled();
  });
});
