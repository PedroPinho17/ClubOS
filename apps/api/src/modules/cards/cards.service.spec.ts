import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CardsService } from "./cards.service";

describe("CardsService.updateSettings", () => {
  const prisma = {
    organization: { findUnique: vi.fn() },
    organizationSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
  const storage = { getUrl: vi.fn() };
  const service = new CardsService(prisma as never, storage as never);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.organization.findUnique.mockResolvedValue({
      id: "org-1",
      name: "CRC",
      primaryColor: "#111",
      logoUrl: null,
    });
    prisma.organizationSetting.findUnique.mockResolvedValue(null);
    prisma.organizationSetting.upsert.mockResolvedValue({});
  });

  it("bloqueia template crc_vale para nao-imperador", async () => {
    await expect(
      service.updateSettings(
        "org-1",
        { template: "crc_vale" },
        "administrador",
      ),
    ).rejects.toThrow(
      new ForbiddenException(
        "Apenas o Imperador pode ativar o layout CRC Vale.",
      ),
    );
  });

  it("permite imperador activar crc_vale", async () => {
    const result = await service.updateSettings(
      "org-1",
      { template: "crc_vale", crcValeEnabled: true },
      "imperador",
    );
    expect(result.layout.template).toBe("crc_vale");
    expect(prisma.organizationSetting.upsert).toHaveBeenCalled();
  });

  it("falha se a organizacao nao existe", async () => {
    prisma.organization.findUnique.mockResolvedValue(null);
    await expect(
      service.updateSettings("missing", { showNome: false }, "administrador"),
    ).rejects.toThrow(new NotFoundException("Organizacao nao encontrada."));
  });
});
