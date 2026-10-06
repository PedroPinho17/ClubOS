import { beforeEach, describe, expect, it, vi } from "vitest";
import { HostOrgController } from "./host-org.controller";

describe("HostOrgController", () => {
  const hostOrgs = { findByHostname: vi.fn() };
  const storage = { getUrl: vi.fn() };
  const controller = new HostOrgController(hostOrgs as never, storage as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devolve platform sem host de clube", async () => {
    const req = { headers: { host: "localhost:3000" } };
    const out = await controller.hostOrg(req as never);
    expect(out.kind).toBe("platform");
    expect(hostOrgs.findByHostname).not.toHaveBeenCalled();
  });

  it("devolve org quando hostname mapeia", async () => {
    hostOrgs.findByHostname.mockResolvedValue({
      id: "o1",
      name: "CRC",
      primaryColor: "#111",
      logoKey: "logo",
    });
    storage.getUrl.mockResolvedValue("https://cdn/l.png");

    const req = { headers: { host: "www.crcvale.pt" } };
    const out = await controller.hostOrg(req as never);

    expect(out).toEqual({
      kind: "org",
      id: "o1",
      name: "CRC",
      primaryColor: "#111",
      logoUrl: "https://cdn/l.png",
      passkeysEnabled: expect.any(Boolean),
    });
  });
});
