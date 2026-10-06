import { describe, expect, it, vi } from "vitest";
import { AuditController } from "./audit.controller";

describe("AuditController", () => {
  it("list delega com limit", async () => {
    const audit = { list: vi.fn().mockResolvedValue([]) };
    const controller = new AuditController(audit as never);
    await controller.list("org-1", { limit: 50 } as never);
    expect(audit.list).toHaveBeenCalledWith("org-1", 50);
  });
});
