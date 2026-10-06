import { describe, expect, it, vi } from "vitest";
import { PortalController } from "./portal.controller";

describe("PortalController", () => {
  const portal = {
    getOrganizationBranding: vi.fn(),
    getLogoBuffer: vi.fn(),
    getMe: vi.fn(),
    getReceipt: vi.fn(),
    listCommunications: vi.fn(),
    markCommunicationRead: vi.fn(),
    grantAccess: vi.fn(),
  };
  const controller = new PortalController(portal as never);
  const user = { id: "u1" };

  it("endpoints portal", async () => {
    await controller.organizationBranding(user as never);
    portal.getLogoBuffer.mockResolvedValue({
      buffer: Buffer.from("x"),
      contentType: "image/png",
    });
    const res = {
      set: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
      end: vi.fn(),
    };
    await controller.organizationLogo(user as never, res as never);
    await controller.me(user as never);
    portal.getReceipt.mockResolvedValue({
      filename: "r.pdf",
      buffer: Buffer.from("%PDF"),
    });
    await controller.receipt(user as never, "p1", res as never);
    await controller.communications(user as never);
    await controller.markRead(user as never, "c1");
    await controller.grant("o1", "m1", { password: "Secret1!" } as never);
    expect(portal.grantAccess).toHaveBeenCalledWith("o1", "m1", "Secret1!");
  });
});
