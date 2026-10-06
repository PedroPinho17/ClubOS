import { describe, expect, it, vi } from "vitest";
import { DevicesController } from "./devices.controller";

describe("DevicesController", () => {
  const push = {
    listDevices: vi.fn(),
    registerDevice: vi.fn(),
    unregisterDevice: vi.fn(),
    updatePreferences: vi.fn(),
  };
  const controller = new DevicesController(push as never);
  const user = { id: "u1" };

  it("list / register / unregister / updatePreferences", async () => {
    push.listDevices.mockResolvedValue([]);
    await controller.list(user as never);
    expect(push.listDevices).toHaveBeenCalledWith("u1");

    await controller.register(user as never, { token: "t" } as never);
    expect(push.registerDevice).toHaveBeenCalledWith("u1", { token: "t" });

    await controller.unregister(user as never, encodeURIComponent("tok/1"));
    expect(push.unregisterDevice).toHaveBeenCalledWith("u1", "tok/1");

    await controller.updatePreferences(
      user as never,
      encodeURIComponent("tok/2"),
      { preferences: { quotas: false } } as never,
    );
    expect(push.updatePreferences).toHaveBeenCalledWith("u1", "tok/2", {
      quotas: false,
    });
  });
});
