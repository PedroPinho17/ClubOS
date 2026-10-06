import { describe, expect, it, vi } from "vitest";
import { DashboardController } from "./dashboard.controller";

describe("DashboardController", () => {
  it("stats delega no service", async () => {
    const dashboard = { stats: vi.fn().mockResolvedValue({ members: 1 }) };
    const controller = new DashboardController(dashboard as never);
    await expect(controller.stats("org-1")).resolves.toEqual({ members: 1 });
    expect(dashboard.stats).toHaveBeenCalledWith("org-1");
  });
});
