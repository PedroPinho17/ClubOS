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

import { processReceiptJob, ReceiptWorker } from "./receipt.worker";

describe("processReceiptJob", () => {
  it("gera PDF, cacheia e envia email quando socio tem email", async () => {
    const buffer = Buffer.from("pdf");
    const generateReceipt = vi
      .fn()
      .mockResolvedValue({ filename: "recibo.pdf", buffer });
    const cacheReceipt = vi.fn().mockResolvedValue(undefined);
    const findOne = vi.fn().mockResolvedValue({
      id: "pay-1",
      amount: 10,
      member: { name: "Joao Silva", email: "joao@example.com", userId: null },
      organization: {
        name: "CRC Vale",
        primaryColor: "#1d4ed8",
        logoUrl: null,
      },
    });
    const send = vi.fn().mockResolvedValue(undefined);

    await processReceiptJob(
      { payments: { generateReceipt, cacheReceipt, findOne }, mail: { send } },
      { organizationId: "org-1", paymentId: "pay-1" },
    );

    expect(generateReceipt).toHaveBeenCalledWith("org-1", "pay-1");
    expect(cacheReceipt).toHaveBeenCalledWith("pay-1", buffer);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "joao@example.com",
        html: expect.stringContaining("Joao Silva"),
        attachments: [
          {
            filename: "recibo.pdf",
            content: buffer,
            contentType: "application/pdf",
          },
        ],
      }),
    );
  });

  it("nao envia email quando socio nao tem email", async () => {
    const send = vi.fn();
    const warn = vi.fn();
    await processReceiptJob(
      {
        payments: {
          generateReceipt: vi
            .fn()
            .mockResolvedValue({ filename: "r.pdf", buffer: Buffer.from("x") }),
          cacheReceipt: vi.fn(),
          findOne: vi.fn().mockResolvedValue({
            amount: 10,
            member: { name: "Sem Email", email: null, userId: null },
            organization: {
              name: "CRC Vale",
              primaryColor: null,
              logoUrl: null,
            },
          }),
        },
        mail: { send },
        logger: { warn },
      },
      { organizationId: "org-1", paymentId: "pay-2" },
    );
    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("notifica push quando membro tem userId", async () => {
    const notifyUser = vi.fn().mockResolvedValue({ enqueued: 1 });
    await processReceiptJob(
      {
        payments: {
          generateReceipt: vi.fn().mockResolvedValue({
            filename: "r.pdf",
            buffer: Buffer.from("pdf"),
          }),
          cacheReceipt: vi.fn(),
          findOne: vi.fn().mockResolvedValue({
            amount: 15,
            member: {
              name: "Ana",
              email: "a@x.pt",
              userId: "u1",
            },
            organization: { name: "CRC", primaryColor: "#000" },
          }),
        },
        mail: { send: vi.fn() },
        push: { notifyUser },
      },
      { organizationId: "org-1", paymentId: "pay-3" },
    );
    expect(notifyUser).toHaveBeenCalledWith(
      "u1",
      "payments",
      "Recibo disponivel",
      expect.any(String),
      { type: "receipt", paymentId: "pay-3" },
    );
  });

  it("aceita paymentOverride sem novo findOne", async () => {
    const findOne = vi.fn();
    await processReceiptJob(
      {
        payments: {
          generateReceipt: vi.fn().mockResolvedValue({
            filename: "r.pdf",
            buffer: Buffer.from("x"),
          }),
          cacheReceipt: vi.fn(),
          findOne,
        },
        mail: { send: vi.fn() },
      },
      { organizationId: "org-1", paymentId: "pay-4" },
      {
        amount: 1,
        member: { name: "X", email: null, userId: null },
        organization: { name: "O", primaryColor: null },
      } as never,
    );
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe("ReceiptWorker", () => {
  beforeEach(() => {
    workerInstances.length = 0;
  });

  it("liga worker, processa job e fecha", async () => {
    const buffer = Buffer.from("pdf");
    const generateReceipt = vi
      .fn()
      .mockResolvedValue({ filename: "recibo.pdf", buffer });
    const cacheReceipt = vi.fn().mockResolvedValue(undefined);
    const findOne = vi.fn().mockResolvedValue({
      amount: 10,
      member: { name: "Joao", email: "j@x.pt", userId: "u1" },
      organization: { name: "CRC", primaryColor: "#111" },
    });
    const send = vi.fn().mockResolvedValue(undefined);
    const notifyUser = vi.fn().mockResolvedValue({ enqueued: 1 });

    const worker = new ReceiptWorker(
      { generateReceipt, cacheReceipt, findOne } as never,
      { send } as never,
      { notifyUser } as never,
    );
    worker.onModuleInit();
    expect(workerInstances).toHaveLength(1);

    const fake = workerInstances[0]!;
    await fake.processor({
      data: { organizationId: "org-1", paymentId: "pay-w" },
    });
    expect(generateReceipt).toHaveBeenCalledWith("org-1", "pay-w");
    expect(send).toHaveBeenCalled();
    expect(notifyUser).toHaveBeenCalled();

    expect(fake.handlers.get("completed")).toBeTypeOf("function");
    fake.handlers.get("completed")?.({ data: { paymentId: "pay-w" } });
    const failed = fake.handlers.get("failed");
    expect(failed).toBeTypeOf("function");
    failed?.({ data: { paymentId: "pay-w" } }, new Error("pdf fail"));

    await worker.onModuleDestroy();
    expect(fake.close).toHaveBeenCalled();
  });
});
