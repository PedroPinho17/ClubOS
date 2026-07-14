import { ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import { resolveEffectiveRole } from "./effective-role";

describe("resolveEffectiveRole", () => {
  const prisma = {
    organizationMember: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    prisma.organizationMember.findUnique.mockReset();
  });

  it("devolve socio para contas de portal", async () => {
    await expect(
      resolveEffectiveRole(
        prisma as unknown as PrismaService,
        "u1",
        "socio",
        "org-1",
      ),
    ).resolves.toBe("socio");
    expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
  });

  it("devolve imperador global independentemente da org", async () => {
    await expect(
      resolveEffectiveRole(
        prisma as unknown as PrismaService,
        "u1",
        "imperador",
        "org-1",
      ),
    ).resolves.toBe("imperador");
    expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
  });

  it("devolve orgRole da membership activa", async () => {
    prisma.organizationMember.findUnique.mockResolvedValue({
      orgRole: "tesoureiro",
    });

    await expect(
      resolveEffectiveRole(
        prisma as unknown as PrismaService,
        "u1",
        "administrador",
        "org-1",
      ),
    ).resolves.toBe("tesoureiro");
  });

  it("rejeita staff sem membership na org", async () => {
    prisma.organizationMember.findUnique.mockResolvedValue(null);

    await expect(
      resolveEffectiveRole(
        prisma as unknown as PrismaService,
        "u1",
        "administrador",
        "org-1",
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
