import { describe, expect, it, vi } from "vitest";
import { MeController } from "./me.controller";

describe("MeController", () => {
  const me = {
    listOrganizations: vi.fn(),
    getActiveContext: vi.fn(),
    setActiveOrganization: vi.fn(),
    completePasswordChange: vi.fn(),
    requestAccountDeletion: vi.fn(),
  };
  const controller = new MeController(me as never);
  const user = { id: "u1", role: "administrador" };

  it("organizations e context", async () => {
    me.listOrganizations.mockResolvedValue([]);
    await controller.organizations(user as never);
    expect(me.listOrganizations).toHaveBeenCalledWith(user);

    me.getActiveContext.mockResolvedValue({ organizationId: "o1" });
    await controller.context(user as never, {} as never);
    expect(me.getActiveContext).toHaveBeenCalled();
  });

  it("setActiveOrganization define cookie", async () => {
    me.setActiveOrganization.mockResolvedValue({
      organizationId: "o1",
      name: "CRC",
    });
    const res = { setHeader: vi.fn() };
    const req = { session: { token: "t" }, activeOrganizationId: undefined };
    await controller.setActiveOrganization(
      user as never,
      { organizationId: "o1" } as never,
      req as never,
      res as never,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Set-Cookie",
      expect.stringContaining("o1"),
    );
    expect(req.activeOrganizationId).toBe("o1");
  });

  it("completePasswordChange e accountDeletion", async () => {
    await controller.completePasswordChange(user as never);
    expect(me.completePasswordChange).toHaveBeenCalledWith("u1");
    await controller.accountDeletion(
      user as never,
      {
        reason: "x",
      } as never,
    );
    expect(me.requestAccountDeletion).toHaveBeenCalledWith("u1", "x");
  });
});
