import { beforeEach, describe, expect, it, vi } from "vitest";
import { HostOrganizationService } from "./host-organization.service";

describe("HostOrganizationService", () => {
  const prisma = { organization: { findFirst: vi.fn() } };
  const service = new HostOrganizationService(prisma as never);

  beforeEach(() => vi.clearAllMocks());

  it("resolveFromRequest ignora platform host", async () => {
    const req = { headers: { host: "localhost:3000" } };
    await expect(service.resolveFromRequest(req as never)).resolves.toBeNull();
    expect(prisma.organization.findFirst).not.toHaveBeenCalled();
  });

  it("resolveFromRequest devolve orgId quando domain bate", async () => {
    prisma.organization.findFirst.mockResolvedValue({
      id: "o1",
      domain: "crcvale.pt",
      name: "CRC",
      primaryColor: "#000",
      logoKey: null,
    });
    const req = { headers: { host: "www.crcvale.pt" } };
    await expect(service.resolveFromRequest(req as never)).resolves.toEqual({
      organizationId: "o1",
      domain: "crcvale.pt",
    });
  });

  it("findByHostname devolve null sem candidatos", async () => {
    await expect(service.findByHostname("")).resolves.toBeNull();
  });
});
