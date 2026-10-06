import { describe, expect, it, vi } from "vitest";
import { MembershipPlansController } from "./membership-plans.controller";

describe("MembershipPlansController", () => {
  const plans = {
    list: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  const controller = new MembershipPlansController(plans as never);

  it("CRUD delega no service", async () => {
    await controller.list("o1");
    await controller.findOne("o1", "p1");
    await controller.create("o1", { name: "Mensal" } as never);
    await controller.update("o1", "p1", { name: "Anual" } as never);
    await controller.remove("o1", "p1");
    expect(plans.remove).toHaveBeenCalledWith("o1", "p1");
  });
});
