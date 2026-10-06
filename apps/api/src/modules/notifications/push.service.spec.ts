import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PushService } from "./push.service";

describe("PushService", () => {
  const prisma = {
    deviceToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  const queue = { enqueueMany: vi.fn().mockResolvedValue(undefined) };
  const service = new PushService(prisma as never, queue as never);

  beforeEach(() => {
    vi.clearAllMocks();
    queue.enqueueMany.mockResolvedValue(undefined);
  });

  it("registerDevice cria token novo", async () => {
    prisma.deviceToken.findUnique.mockResolvedValue(null);
    prisma.deviceToken.create.mockResolvedValue({ id: "d1", token: "t1" });

    await service.registerDevice("u1", {
      token: "t1",
      platform: "ios",
    } as never);

    expect(prisma.deviceToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1", token: "t1" }),
      }),
    );
  });

  it("registerDevice actualiza token existente", async () => {
    prisma.deviceToken.findUnique.mockResolvedValue({
      token: "t1",
      organizationId: "o1",
      preferences: { quotas: false },
    });
    prisma.deviceToken.update.mockResolvedValue({ id: "d1" });

    await service.registerDevice("u2", {
      token: "t1",
      platform: "android",
      appVersion: "1.0",
    } as never);

    expect(prisma.deviceToken.update).toHaveBeenCalled();
    expect(prisma.deviceToken.create).not.toHaveBeenCalled();
  });

  it("unregisterDevice lanca NotFound", async () => {
    prisma.deviceToken.findFirst.mockResolvedValue(null);
    await expect(
      service.unregisterDevice("u1", "missing"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("unregisterDevice desactiva", async () => {
    prisma.deviceToken.findFirst.mockResolvedValue({ id: "d1" });
    prisma.deviceToken.update.mockResolvedValue({});
    await expect(service.unregisterDevice("u1", "t1")).resolves.toEqual({
      ok: true,
    });
  });

  it("listDevices filtra disabledAt null", async () => {
    prisma.deviceToken.findMany.mockResolvedValue([]);
    await service.listDevices("u1");
    expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", disabledAt: null },
      orderBy: { lastSeenAt: "desc" },
    });
  });

  it("updatePreferences exige device do user", async () => {
    prisma.deviceToken.findFirst.mockResolvedValue(null);
    await expect(
      service.updatePreferences("u1", "t1", { quotas: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("notifyUser respeita preferencias e enfileira", async () => {
    prisma.deviceToken.findMany.mockResolvedValue([
      {
        id: "d1",
        token: "tok-a",
        preferences: { communications: true },
      },
      {
        id: "d2",
        token: "tok-b",
        preferences: { communications: false },
      },
    ]);

    const out = await service.notifyUser(
      "u1",
      "communications",
      "Titulo",
      "Corpo",
      { type: "x" },
    );
    expect(out.enqueued).toBe(1);
    expect(queue.enqueueMany).toHaveBeenCalledWith([
      expect.objectContaining({ token: "tok-a", title: "Titulo" }),
    ]);
  });

  it("notifyUser devolve 0 sem devices", async () => {
    prisma.deviceToken.findMany.mockResolvedValue([]);
    await expect(service.notifyUser("u1", "quotas", "T", "B")).resolves.toEqual(
      { enqueued: 0 },
    );
  });

  it("notifyMembers soma enqueued", async () => {
    prisma.deviceToken.findMany
      .mockResolvedValueOnce([{ id: "d1", token: "t1", preferences: {} }])
      .mockResolvedValueOnce([]);

    const out = await service.notifyMembers(["u1", "u2"], "payments", "P", "B");
    expect(out.enqueued).toBe(1);
  });
});
