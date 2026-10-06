import { describe, expect, it, vi } from "vitest";
import { OrganizationsController } from "./organizations.controller";

describe("OrganizationsController", () => {
  const organizations = {
    findById: vi.fn(),
    getLogoBuffer: vi.fn(),
    update: vi.fn(),
    setLogo: vi.fn(),
    getSettings: vi.fn(),
    setSetting: vi.fn(),
  };
  const controller = new OrganizationsController(organizations as never);

  it("current / logo / update / settings", async () => {
    await controller.current("o1");
    organizations.getLogoBuffer.mockResolvedValue({
      buffer: Buffer.from("x"),
      contentType: "image/png",
    });
    const res = { set: vi.fn(), send: vi.fn() };
    await controller.logo("o1", res as never);
    await controller.update(
      "o1",
      { name: "X" } as never,
      { role: "imperador" } as never,
    );
    expect(organizations.update).toHaveBeenCalledWith(
      "o1",
      { name: "X" },
      true,
    );
    await controller.uploadLogo("o1", {
      buffer: Buffer.from("p"),
      mimetype: "image/png",
      size: 1,
    });
    await controller.settings("o1");
    await controller.setSetting("o1", { key: "a", value: 1 } as never);
  });
});
