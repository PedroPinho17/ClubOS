import { describe, expect, it, vi } from "vitest";
import { RemindersController } from "./reminders.controller";

describe("RemindersController", () => {
  it("run dispara lembretes da org", async () => {
    const reminders = {
      runForOrganization: vi.fn().mockResolvedValue({ sent: 1 }),
    };
    const controller = new RemindersController(reminders as never);
    await expect(controller.run("o1")).resolves.toEqual({ sent: 1 });
    expect(reminders.runForOrganization).toHaveBeenCalledWith("o1");
  });
});
