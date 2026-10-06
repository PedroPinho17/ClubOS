import { CommunicationStatus } from "@clubos/database";
import { describe, expect, it, vi } from "vitest";
import { processCommunicationsWorkerJob } from "./communications.worker";

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
