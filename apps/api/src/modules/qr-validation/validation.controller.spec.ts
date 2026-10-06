import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../common/qr-signature", () => ({
  verifyValidationSignature: vi.fn(),
}));

import { verifyValidationSignature } from "../../common/qr-signature";
import { ValidationController } from "./validation.controller";

describe("ValidationController", () => {
  const validation = {
    validate: vi.fn(),
    scanForStaff: vi.fn(),
  };
  const controller = new ValidationController(validation as never);

  it("validate rejeita assinatura invalida", () => {
    vi.mocked(verifyValidationSignature).mockReturnValue(false);
    expect(() => controller.validate("m1", "999", "bad")).toThrow(
      UnauthorizedException,
    );
  });

  it("validate ok", () => {
    vi.mocked(verifyValidationSignature).mockReturnValue(true);
    validation.validate.mockResolvedValue({ ok: true });
    controller.validate("m1", "9999999999", "sig");
    expect(validation.validate).toHaveBeenCalledWith("m1");
  });

  it("scan delega", async () => {
    validation.scanForStaff.mockResolvedValue({ valid: true });
    await controller.scan(
      "o1",
      { id: "u1" } as never,
      { payload: "qr" } as never,
      { ip: "127.0.0.1" } as never,
    );
    expect(validation.scanForStaff).toHaveBeenCalledWith(
      "o1",
      "u1",
      "qr",
      "127.0.0.1",
    );
  });
});
