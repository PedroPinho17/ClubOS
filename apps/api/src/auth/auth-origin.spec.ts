import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clubos/database", () => ({
  prisma: {
    member: { findFirst: vi.fn() },
    organizationMember: { findFirst: vi.fn() },
  },
}));

vi.mock("../common/public-origin", () => ({
  publicOriginForOrg: vi.fn((org: { domain?: string | null }) =>
    org.domain ? `https://${org.domain}` : "http://localhost:3000",
  ),
}));

describe("publicOriginForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa org do socio", async () => {
    const { prisma } = await import("@clubos/database");
    vi.mocked(prisma.member.findFirst).mockResolvedValue({
      organization: { domain: "crcvale.pt" },
    } as never);
    const { publicOriginForUser } = await import("./auth-origin");
    await expect(publicOriginForUser("u1")).resolves.toBe("https://crcvale.pt");
  });

  it("fallback para membership staff", async () => {
    const { prisma } = await import("@clubos/database");
    vi.mocked(prisma.member.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      organization: { domain: "clube.pt" },
    } as never);
    const { publicOriginForUser } = await import("./auth-origin");
    await expect(publicOriginForUser("u1")).resolves.toBe("https://clube.pt");
  });
});
