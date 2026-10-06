import { describe, expect, it, vi } from "vitest";
import { CommunicationAudience } from "@clubos/database";
import { CommunicationsController } from "./communications.controller";

describe("CommunicationsController", () => {
  const communications = {
    list: vi.fn(),
    previewCount: vi.fn(),
    previewWhatsappCount: vi.fn(),
    previewEmail: vi.fn(),
    findOne: vi.fn(),
    generateWhatsappLinks: vi.fn(),
    create: vi.fn(),
  };
  const controller = new CommunicationsController(communications as never);

  it("delega endpoints", async () => {
    await controller.list("o1");
    await controller.preview("o1", CommunicationAudience.ALL);
    await controller.previewWhatsapp("o1", CommunicationAudience.ACTIVE);
    await controller.previewEmail("o1", {
      subject: "S",
      body: "B",
    } as never);
    await controller.findOne("o1", "c1");
    await controller.whatsappLinks("o1", {
      audience: CommunicationAudience.ALL,
      body: "Oi",
    } as never);
    await controller.create(
      "o1",
      { id: "u1" } as never,
      { subject: "S", body: "B", audience: CommunicationAudience.ALL } as never,
    );
    expect(communications.create).toHaveBeenCalled();
  });
});
