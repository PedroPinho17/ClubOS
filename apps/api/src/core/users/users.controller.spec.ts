import { describe, expect, it, vi } from "vitest";
import { UsersController } from "./users.controller";

describe("UsersController", () => {
  const users = {
    listStaff: vi.fn(),
    invite: vi.fn(),
  };
  const controller = new UsersController(users as never);

  it("list e invite", async () => {
    await controller.list("o1");
    expect(users.listStaff).toHaveBeenCalledWith("o1");
    await controller.invite("o1", { id: "admin" } as never, "administrador", {
      email: "x@y.pt",
      role: "tesoureiro",
    } as never);
    expect(users.invite).toHaveBeenCalledWith(
      "o1",
      "administrador",
      "admin",
      expect.objectContaining({ email: "x@y.pt" }),
    );
  });
});
