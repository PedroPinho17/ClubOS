import { CommunicationStatus } from "@clubos/database";
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
      _opts: unknown,
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

import {
  CommunicationsWorker,
  processCommunicationsWorkerJob,
} from "./communications.worker";

describe("processCommunicationsWorkerJob", () => {
  it("carrega branding e envia email", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const communication = {
      findUnique: vi.fn().mockResolvedValue({
        organization: { name: "CRC Vale", primaryColor: "#111" },
      }),
      update: vi
        .fn()
        .mockResolvedValueOnce({
          id: "c1",
          sentCount: 1,
          failedCount: 0,
          totalRecipients: 1,
        })
        .mockResolvedValueOnce({
          id: "c1",
          status: CommunicationStatus.SENT,
        }),
    };

    await processCommunicationsWorkerJob(
      {
        mail: { send },
        prisma: { communication } as never,
      },
      {
        communicationId: "c1",
        organizationId: "o1",
        email: "a@x.pt",
        memberName: "Ana",
        subject: "Aviso",
        body: "Ola",
      },
    );

    expect(communication.findUnique).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@x.pt",
        html: expect.stringContaining("Ana"),
      }),
    );
  });

  it("funciona sem organizacao (branding fallback)", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const communication = {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({
        id: "c2",
        sentCount: 1,
        failedCount: 0,
        totalRecipients: 1,
      }),
    };

    await processCommunicationsWorkerJob(
      {
        mail: { send },
        prisma: { communication } as never,
      },
      {
        communicationId: "c2",
        organizationId: "o1",
        email: "b@x.pt",
        memberName: "B",
        subject: "S",
        body: "B",
      },
    );

    expect(send).toHaveBeenCalled();
  });
});

describe("CommunicationsWorker", () => {
  beforeEach(() => {
    workerInstances.length = 0;
  });

  it("liga worker, processa job e fecha", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const communication = {
      findUnique: vi.fn().mockResolvedValue({
        organization: { name: "CRC", primaryColor: "#000" },
      }),
      update: vi.fn().mockResolvedValue({
        id: "c3",
        sentCount: 1,
        failedCount: 0,
        totalRecipients: 1,
      }),
    };

    const worker = new CommunicationsWorker(
      { send } as never,
      { communication } as never,
    );
    worker.onModuleInit();
    expect(workerInstances).toHaveLength(1);

    const fake = workerInstances[0]!;
    await fake.processor({
      data: {
        communicationId: "c3",
        organizationId: "o1",
        email: "c@x.pt",
        memberName: "C",
        subject: "S",
        body: "Body",
      },
    });
    expect(send).toHaveBeenCalled();

    const failed = fake.handlers.get("failed");
    expect(failed).toBeTypeOf("function");
    failed?.({ data: { communicationId: "c3" } }, new Error("smtp down"));

    await worker.onModuleDestroy();
    expect(fake.close).toHaveBeenCalled();
  });
});
