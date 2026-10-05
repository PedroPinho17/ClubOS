import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CommunicationAudience } from "@clubos/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommunicationsService } from "./communications.service";

describe("CommunicationsService", () => {
  const prisma = {
    communication: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    member: { findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
    organizationSetting: { findMany: vi.fn() },
  };
  const queue = { enqueueMany: vi.fn().mockResolvedValue(undefined) };
  const push = { notifyMembers: vi.fn().mockResolvedValue(undefined) };

  const service = new CommunicationsService(
    prisma as never,
    queue as never,
    push as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.organizationSetting.findMany.mockResolvedValue([]);
    queue.enqueueMany.mockResolvedValue(undefined);
    push.notifyMembers.mockResolvedValue(undefined);
  });

  it("list filtra por organizationId", async () => {
    prisma.communication.findMany.mockResolvedValue([]);
    await service.list("org-1");
    expect(prisma.communication.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("findOne lanca NotFoundException fora do tenant", async () => {
    prisma.communication.findFirst.mockResolvedValue(null);
    await expect(service.findOne("org-1", "c1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("previewCount conta emails da audiencia ACTIVE", async () => {
    prisma.member.findMany.mockResolvedValue([
      { email: "a@x.pt", name: "A", phone: null, userId: null },
      { email: null, name: "B", phone: null, userId: null },
    ]);
    const out = await service.previewCount(
      "org-1",
      CommunicationAudience.ACTIVE,
    );
    expect(out).toEqual({ count: 1 });
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("generateWhatsappLinks exige planId para PLAN", async () => {
    await expect(
      service.generateWhatsappLinks("org-1", {
        audience: CommunicationAudience.PLAN,
        body: "Oi",
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("generateWhatsappLinks devolve links normalizados", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        name: "Ana",
        phone: "+351912345678",
        email: "a@x.pt",
        userId: "u1",
        quotaPlan: null,
        payments: [],
        cardValidUntil: null,
        joinedAt: new Date(),
      },
    ]);
    const out = await service.generateWhatsappLinks("org-1", {
      audience: CommunicationAudience.ALL,
      body: "Quotas",
    } as never);
    expect(out.links).toHaveLength(1);
    expect(out.links[0]?.url).toContain("wa.me/");
    expect(out.links[0]?.name).toBe("Ana");
  });

  it("generateWhatsappLinks falha sem telemoveis", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        name: "X",
        phone: null,
        email: "x@y.pt",
        userId: null,
        quotaPlan: null,
        payments: [],
        cardValidUntil: null,
        joinedAt: new Date(),
      },
    ]);
    await expect(
      service.generateWhatsappLinks("org-1", {
        audience: CommunicationAudience.ALL,
        body: "Oi",
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("previewEmail renderiza HTML com branding", async () => {
    prisma.organization.findUnique.mockResolvedValue({
      name: "CRC Vale",
      primaryColor: "#112233",
    });
    const out = await service.previewEmail("org-1", {
      subject: "Aviso",
      body: "Texto",
      sampleName: "Maria",
    });
    expect(out.sampleName).toBe("Maria");
    expect(out.html).toContain("Maria");
    expect(out.text).toContain("Texto");
  });

  it("create enfileira emails e push", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        id: "m1",
        name: "Ana",
        email: "ana@x.pt",
        phone: null,
        userId: "u1",
        quotaPlan: null,
        payments: [],
        cardValidUntil: null,
        joinedAt: new Date(),
      },
    ]);
    prisma.communication.create.mockResolvedValue({ id: "c-new" });

    const comm = await service.create("org-1", "admin-1", {
      subject: "Ola",
      body: "Corpo",
      audience: CommunicationAudience.ALL,
    } as never);

    expect(comm).toEqual({ id: "c-new" });
    expect(queue.enqueueMany).toHaveBeenCalledWith([
      expect.objectContaining({
        communicationId: "c-new",
        email: "ana@x.pt",
        subject: "Ola",
      }),
    ]);
    expect(push.notifyMembers).toHaveBeenCalledWith(
      ["u1"],
      "communications",
      "Nova comunicacao",
      expect.any(String),
      { type: "communication", id: "c-new" },
    );
  });

  it("create rejeita audiencia PLAN sem planId", async () => {
    await expect(
      service.create("org-1", "u", {
        subject: "S",
        body: "B",
        audience: CommunicationAudience.PLAN,
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("create rejeita sem destinatarios com email", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        id: "m1",
        name: "Sem Email",
        email: null,
        phone: "912",
        userId: null,
        quotaPlan: null,
        payments: [],
        cardValidUntil: null,
        joinedAt: new Date(),
      },
    ]);
    await expect(
      service.create("org-1", "u", {
        subject: "S",
        body: "B",
        audience: CommunicationAudience.ALL,
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("previewWhatsappCount e OVERDUE filtram por quota", async () => {
    prisma.member.findMany.mockResolvedValue([
      {
        name: "Atrasado",
        phone: "912345678",
        email: "a@x.pt",
        userId: null,
        joinedAt: new Date("2020-01-01T00:00:00.000Z"),
        cardValidUntil: null,
        quotaPlan: { periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date("2020-02-01T00:00:00.000Z") }],
      },
      {
        name: "Ok",
        phone: "913345678",
        email: "b@x.pt",
        userId: null,
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        cardValidUntil: null,
        quotaPlan: { periodicity: "MONTHLY" },
        payments: [{ paidAt: new Date() }],
      },
    ]);

    const out = await service.previewWhatsappCount(
      "org-1",
      CommunicationAudience.OVERDUE,
    );
    expect(out.count).toBe(1);
  });
});
