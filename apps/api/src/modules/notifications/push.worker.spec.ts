import { describe, expect, it, vi } from "vitest";
import { processPushJob, processPushReceipts } from "./push.worker";

describe("processPushJob", () => {
  it("desactiva token invalido", async () => {
    const update = vi.fn();
    await processPushJob(
      {
        prisma: { deviceToken: { update } } as never,
        expo: {
          sendPushNotificationsAsync: vi.fn(),
          getPushNotificationReceiptsAsync: vi.fn(),
        },
        ticketMap: new Map(),
        isExpoPushToken: () => false,
      },
      {
        token: "bad",
        title: "T",
        body: "B",
        data: {},
        deviceTokenId: "d1",
      },
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "d1" },
        data: expect.objectContaining({ disabledAt: expect.any(Date) }),
      }),
    );
  });

  it("envia e guarda ticket ok", async () => {
    const ticketMap = new Map<string, string>();
    const sendPushNotificationsAsync = vi
      .fn()
      .mockResolvedValue([{ status: "ok", id: "ticket-1" }]);
    await processPushJob(
      {
        prisma: { deviceToken: { update: vi.fn() } } as never,
        expo: {
          sendPushNotificationsAsync,
          getPushNotificationReceiptsAsync: vi.fn(),
        },
        ticketMap,
        isExpoPushToken: () => true,
      },
      {
        token: "ExponentPushToken[xxx]",
        title: "Titulo",
        body: "Corpo",
        data: { type: "x" },
        deviceTokenId: "d2",
      },
    );
    expect(sendPushNotificationsAsync).toHaveBeenCalled();
    expect(ticketMap.get("ticket-1")).toBe("d2");
  });

  it("DeviceNotRegistered desactiva dispositivo", async () => {
    const update = vi.fn();
    await processPushJob(
      {
        prisma: { deviceToken: { update } } as never,
        expo: {
          sendPushNotificationsAsync: vi.fn().mockResolvedValue([
            {
              status: "error",
              message: "gone",
              details: { error: "DeviceNotRegistered" },
            },
          ]),
          getPushNotificationReceiptsAsync: vi.fn(),
        },
        ticketMap: new Map(),
        logger: { warn: vi.fn(), error: vi.fn() },
        isExpoPushToken: () => true,
      },
      {
        token: "ExponentPushToken[yyy]",
        title: "T",
        body: "B",
        data: {},
        deviceTokenId: "d3",
      },
    );
    expect(update).toHaveBeenCalled();
  });
});

describe("processPushReceipts", () => {
  it("noop sem tickets", async () => {
    const getPushNotificationReceiptsAsync = vi.fn();
    await processPushReceipts({
      prisma: { deviceToken: { update: vi.fn() } } as never,
      expo: {
        sendPushNotificationsAsync: vi.fn(),
        getPushNotificationReceiptsAsync,
      },
      ticketMap: new Map(),
    });
    expect(getPushNotificationReceiptsAsync).not.toHaveBeenCalled();
  });

  it("desactiva DeviceNotRegistered no receipt", async () => {
    const update = vi.fn();
    const ticketMap = new Map([["t1", "d9"]]);
    await processPushReceipts({
      prisma: { deviceToken: { update } } as never,
      expo: {
        sendPushNotificationsAsync: vi.fn(),
        getPushNotificationReceiptsAsync: vi.fn().mockResolvedValue({
          t1: {
            status: "error",
            details: { error: "DeviceNotRegistered" },
          },
        }),
      },
      ticketMap,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "d9" } }),
    );
    expect(ticketMap.size).toBe(0);
  });

  it("loga falha ao ler receipts", async () => {
    const warn = vi.fn();
    const ticketMap = new Map([["t1", "d1"]]);
    await processPushReceipts({
      prisma: { deviceToken: { update: vi.fn() } } as never,
      expo: {
        sendPushNotificationsAsync: vi.fn(),
        getPushNotificationReceiptsAsync: vi
          .fn()
          .mockRejectedValue(new Error("network")),
      },
      ticketMap,
      logger: { warn, error: vi.fn() },
    });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/receipts/i));
  });
});
