import { beforeEach, describe, expect, it, vi } from "vitest";

const { FakeWorker, workerInstances } = vi.hoisted(() => {
  const workerInstances: Array<{
    close: ReturnType<typeof vi.fn>;
    handlers: Map<string, (...args: unknown[]) => void>;
    processor: (job: { data: unknown }) => Promise<void>;
  }> = [];

  class FakeWorker {
    close = vi.fn().mockResolvedValue(undefined);
    handlers = new Map<string, (...args: unknown[]) => void>();
    processor: (job: { data: unknown }) => Promise<void>;

    constructor(
      _name: string,
      processor: (job: { data: unknown }) => Promise<void>,
    ) {
      this.processor = processor;
      workerInstances.push(this);
    }

    on(event: string, handler: (...args: unknown[]) => void): this {
      this.handlers.set(event, handler);
      return this;
    }
  }

  return { FakeWorker, workerInstances };
});

vi.mock("bullmq", () => ({ Worker: FakeWorker }));
vi.mock("expo-server-sdk", () => ({
  Expo: class {
    sendPushNotificationsAsync = vi.fn();
    getPushNotificationReceiptsAsync = vi.fn();
    static isExpoPushToken = () => true;
  },
}));

import { processPushJob, processPushReceipts, PushWorker } from "./push.worker";

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

  it("ticket error generico so faz warn", async () => {
    const update = vi.fn();
    const warn = vi.fn();
    await processPushJob(
      {
        prisma: { deviceToken: { update } } as never,
        expo: {
          sendPushNotificationsAsync: vi.fn().mockResolvedValue([
            {
              status: "error",
              message: "MessageTooBig",
              details: { error: "MessageTooBig" },
            },
          ]),
          getPushNotificationReceiptsAsync: vi.fn(),
        },
        ticketMap: new Map(),
        logger: { warn, error: vi.fn() },
        isExpoPushToken: () => true,
      },
      {
        token: "ExponentPushToken[zzz]",
        title: "T",
        body: "B",
        data: {},
        deviceTokenId: "d4",
      },
    );
    expect(update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ticket error/i));
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

  it("receipt ok remove ticket sem desactivar", async () => {
    const update = vi.fn();
    const ticketMap = new Map([["t-ok", "d-ok"]]);
    await processPushReceipts({
      prisma: { deviceToken: { update } } as never,
      expo: {
        sendPushNotificationsAsync: vi.fn(),
        getPushNotificationReceiptsAsync: vi.fn().mockResolvedValue({
          "t-ok": { status: "ok" },
        }),
      },
      ticketMap,
    });
    expect(update).not.toHaveBeenCalled();
    expect(ticketMap.size).toBe(0);
  });

  it("ignora receipt sem deviceTokenId no mapa", async () => {
    const update = vi.fn();
    const ticketMap = new Map([["known", "d1"]]);
    await processPushReceipts({
      prisma: { deviceToken: { update } } as never,
      expo: {
        sendPushNotificationsAsync: vi.fn(),
        getPushNotificationReceiptsAsync: vi.fn().mockResolvedValue({
          known: { status: "ok" },
          orphan: {
            status: "error",
            details: { error: "DeviceNotRegistered" },
          },
        }),
      },
      ticketMap,
    });
    expect(update).not.toHaveBeenCalled();
    expect(ticketMap.size).toBe(0);
  });
});

describe("PushWorker", () => {
  beforeEach(() => {
    workerInstances.length = 0;
  });

  it("liga worker, processa job, cron e fecha", async () => {
    const update = vi.fn();
    const worker = new PushWorker({
      deviceToken: { update },
    } as never);

    worker.onModuleInit();
    expect(workerInstances).toHaveLength(1);

    const fake = workerInstances[0]!;
    const send = vi
      .spyOn(worker["expo"], "sendPushNotificationsAsync")
      .mockResolvedValue([{ status: "ok", id: "t-class" }] as never);

    await fake.processor({
      data: {
        token: "ExponentPushToken[class]",
        title: "T",
        body: "B",
        data: {},
        deviceTokenId: "dc",
      },
    });
    expect(send).toHaveBeenCalled();
    expect(worker["ticketMap"].get("t-class")).toBe("dc");

    const getReceipts = vi
      .spyOn(worker["expo"], "getPushNotificationReceiptsAsync")
      .mockResolvedValue({ "t-class": { status: "ok" } } as never);
    await worker.checkReceipts();
    expect(getReceipts).toHaveBeenCalled();
    expect(worker["ticketMap"].size).toBe(0);

    const failed = fake.handlers.get("failed");
    expect(failed).toBeTypeOf("function");
    failed?.({ data: { token: "tok" } }, new Error("boom"));

    await worker.onModuleDestroy();
    expect(fake.close).toHaveBeenCalled();
  });
});
