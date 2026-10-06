import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { MembersController } from "./members.controller";

vi.mock("./import/member-spreadsheet", () => ({
  buildImportTemplateBuffer: vi.fn().mockResolvedValue(Buffer.from("xlsx")),
}));

describe("MembersController", () => {
  const members = {
    list: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setPhoto: vi.fn(),
  };
  const memberImport = { importFromBuffer: vi.fn() };
  const memberExport = {
    exportBuffer: vi.fn().mockResolvedValue(Buffer.from("x")),
    exportFilename: vi.fn().mockReturnValue("socios.xlsx"),
  };
  const memberGdpr = {
    buildExport: vi.fn(),
    erasePersonalData: vi.fn(),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const controller = new MembersController(
    members as never,
    memberImport as never,
    memberExport as never,
    memberGdpr as never,
    audit as never,
  );
  const user = { id: "u1" };

  it("list / findOne / create / update / remove", async () => {
    members.list.mockResolvedValue({ items: [] });
    await controller.list("o1", {} as never);
    members.findOne.mockResolvedValue({ id: "m1" });
    await controller.findOne("o1", "m1");
    members.create.mockResolvedValue({ id: "m1" });
    await controller.create("o1", user as never, { name: "A" } as never);
    expect(audit.log).toHaveBeenCalled();
    members.update.mockResolvedValue({ id: "m1" });
    await controller.update("o1", user as never, "m1", {
      name: "B",
    } as never);
    members.remove.mockResolvedValue({ ok: true });
    await controller.remove("o1", user as never, "m1");
  });

  it("export e template", async () => {
    const res = { set: vi.fn(), send: vi.fn() };
    await controller.exportMembers("o1", res as never);
    expect(res.send).toHaveBeenCalled();
    await controller.downloadImportTemplate(res as never);
  });

  it("import rejeita sem ficheiro ou extensao", async () => {
    await expect(
      controller.importSpreadsheet("o1", user as never, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.importSpreadsheet("o1", user as never, {
        buffer: Buffer.from("x"),
        size: 1,
        originalname: "a.csv",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("import ok e gdpr", async () => {
    memberImport.importFromBuffer.mockResolvedValue({
      created: 1,
      updated: 0,
      payments: 0,
      skipped: 0,
      errors: [],
    });
    await controller.importSpreadsheet("o1", user as never, {
      buffer: Buffer.from("x"),
      size: 1,
      originalname: "a.xlsx",
    });

    memberGdpr.buildExport.mockResolvedValue({ id: "m1" });
    const res = { set: vi.fn(), send: vi.fn() };
    await controller.gdprExport("o1", user as never, "m1", res as never);

    await expect(
      controller.gdprErase("o1", user as never, "m1", {
        confirm: false,
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    memberGdpr.erasePersonalData.mockResolvedValue({
      portalUserAnonymized: true,
    });
    await controller.gdprErase("o1", user as never, "m1", {
      confirm: true,
    } as never);

    members.setPhoto.mockResolvedValue({ id: "m1" });
    await controller.uploadPhoto("o1", user as never, "m1", {
      buffer: Buffer.from("p"),
      mimetype: "image/png",
      size: 1,
    });
  });
});
