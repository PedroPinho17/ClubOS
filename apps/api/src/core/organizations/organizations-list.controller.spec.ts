import { describe, expect, it, vi } from "vitest";
import { OrganizationsListController } from "./organizations-list.controller";

describe("OrganizationsListController", () => {
  const organizations = {
    listAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: "o1" }),
  };
  const controller = new OrganizationsListController(organizations as never);

  it("list e create", async () => {
    await controller.list();
    expect(organizations.listAll).toHaveBeenCalled();
    await controller.create({ id: "u1" } as never, { name: "Clube" } as never);
    expect(organizations.create).toHaveBeenCalledWith({ name: "Clube" }, "u1");
  });
});
