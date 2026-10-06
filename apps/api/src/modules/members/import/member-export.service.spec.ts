import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemberExportService } from "./member-export.service";

vi.mock("./member-spreadsheet", () => ({
  buildSpreadsheetBuffer: vi.fn().mockResolvedValue(Buffer.from("xlsx")),
}));

vi.mock("./member-export-rows", () => ({
  buildMemberExportRows: vi.fn().mockReturnValue([["header"], ["row"]]),
}));

describe("MemberExportService", () => {
  const prisma = {
    member: { findMany: vi.fn() },
  };
  const service = new MemberExportService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exportBuffer carrega socios da org", async () => {
    prisma.member.findMany.mockResolvedValue([]);
    const buf = await service.exportBuffer("org-1");
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it("exportFilename usa data ISO", () => {
    expect(service.exportFilename()).toMatch(
      /^socios_\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
  });
});
