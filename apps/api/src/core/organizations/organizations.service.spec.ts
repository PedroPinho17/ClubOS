import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationsService } from "./organizations.service";

vi.mock("../../common/host-origins", () => ({
  invalidateOrgOriginsCache: vi.fn(),
}));

describe("OrganizationsService", () => {
  const prisma = {
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    organizationSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    module: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const storage = {
    getUrl: vi.fn().mockResolvedValue("https://cdn/logo.png"),
    getObject: vi.fn().mockResolvedValue({ body: Buffer.from("img") }),
    upload: vi.fn().mockResolvedValue("key"),
    deleteObject: vi.fn().mockResolvedValue(undefined),
  };

  const service = new OrganizationsService(prisma as never, storage as never);

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getUrl.mockResolvedValue("https://cdn/logo.png");
  });

  it("findById lanca NotFoundException", async () => {
    prisma.organization.findUnique.mockResolvedValue(null);
    await expect(service.findById("o1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("findById devolve org com logoUrl", async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: "o1",
      name: "CRC",
      logoKey: "k1",
    });
    const org = await service.findById("o1");
    expect(org.logoUrl).toBe("https://cdn/logo.png");
  });

  it("getLogoBuffer exige logoKey", async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: "o1",
      logoKey: null,
    });
    await expect(service.getLogoBuffer("o1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("listAll selecciona campos", async () => {
    prisma.organization.findMany.mockResolvedValue([]);
    await service.listAll();
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } }),
    );
  });

  it("create rejeita slug vazio", async () => {
    await expect(
      service.create({ name: "   " } as never, "u1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("create gera slug unico e memberships", async () => {
    prisma.organization.findUnique
      .mockResolvedValueOnce({ id: "taken" })
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: "org-new", name: "Clube", logoKey: null });
    prisma.module.findMany.mockResolvedValue([
      { id: "m1", slug: "dashboard", isCore: true },
      { id: "m2", slug: "reports", isCore: false },
    ]);
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        organization: {
          create: vi.fn().mockResolvedValue({ id: "org-new", name: "Clube" }),
        },
        organizationModule: { create: vi.fn() },
        organizationMember: { create: vi.fn() },
      };
      return fn(tx);
    });

    const org = await service.create({ name: "Clube X" } as never, "creator");
    expect(org.id).toBe("org-new");
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("setLogo valida ficheiro, tipo e tamanho", async () => {
    await expect(service.setLogo("o1", undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.setLogo("o1", {
        buffer: Buffer.from("x"),
        mimetype: "text/plain",
        size: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.setLogo("o1", {
        buffer: Buffer.alloc(6 * 1024 * 1024),
        mimetype: "image/png",
        size: 6 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("setLogo faz upload e apaga logo antigo", async () => {
    prisma.organization.findUnique
      .mockResolvedValueOnce({ logoKey: "old-key" })
      .mockResolvedValue({ id: "o1", name: "CRC", logoKey: "new-key" });
    prisma.organization.update.mockResolvedValue({});

    await service.setLogo("o1", {
      buffer: Buffer.from("png"),
      mimetype: "image/png",
      size: 10,
    });

    expect(storage.upload).toHaveBeenCalled();
    expect(storage.deleteObject).toHaveBeenCalledWith("old-key");
  });

  it("update bloqueia dominio sem canEditDomain", async () => {
    await expect(
      service.update("o1", { domain: "clube.pt" } as never, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("update rejeita dominio invalido ou da plataforma", async () => {
    await expect(
      service.update("o1", { domain: "localhost" } as never, true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("update limpa dominio vazio", async () => {
    prisma.organization.update.mockResolvedValue({});
    prisma.organization.findUnique.mockResolvedValue({
      id: "o1",
      name: "CRC",
      logoKey: null,
    });

    await service.update("o1", { domain: "  " } as never, true);
    expect(prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ domain: null }),
      }),
    );
  });

  it("getSettings e setSetting", async () => {
    prisma.organizationSetting.findMany.mockResolvedValue([
      { key: "a", value: 1 },
    ]);
    await expect(service.getSettings("o1")).resolves.toEqual({ a: 1 });

    prisma.organizationSetting.upsert.mockResolvedValue({ key: "a", value: 2 });
    await service.setSetting("o1", "a", 2);
    expect(prisma.organizationSetting.upsert).toHaveBeenCalled();
  });
});
