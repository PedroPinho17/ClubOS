import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSignedValidationUrl,
  signValidationPayload,
  verifyValidationSignature,
} from "./qr-signature";

describe("qr-signature", () => {
  beforeEach(() => {
    vi.stubEnv("QR_SIGNING_SECRET", "test-qr-secret");
    vi.stubEnv("WEB_ORIGIN", "https://clube.example");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("assina e verifica um payload valido", () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = signValidationPayload("mem-1", expires);
    expect(sig.length).toBeGreaterThan(10);
    expect(verifyValidationSignature("mem-1", expires, sig)).toBe(true);
  });

  it("rejeita assinatura adulterada ou memberId diferente", () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = signValidationPayload("mem-1", expires);
    expect(verifyValidationSignature("mem-1", expires, `${sig}x`)).toBe(false);
    expect(verifyValidationSignature("mem-2", expires, sig)).toBe(false);
  });

  it("rejeita expiracao invalida ou passada", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));

    const past = Math.floor(Date.now() / 1000) - 10;
    const sig = signValidationPayload("mem-1", past);
    expect(verifyValidationSignature("mem-1", past, sig)).toBe(false);
    expect(verifyValidationSignature("mem-1", 0, sig)).toBe(false);
    expect(verifyValidationSignature("mem-1", Number.NaN, sig)).toBe(false);
    expect(verifyValidationSignature("mem-1", past, "")).toBe(false);
  });

  it("constroi URL publica assinada com expires e sig", () => {
    const expiresAt = new Date("2027-01-01T00:00:00.000Z");
    const url = buildSignedValidationUrl("mem-abc", expiresAt);
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://clube.example");
    expect(parsed.pathname).toBe("/validar/mem-abc");

    const expires = Number(parsed.searchParams.get("expires"));
    const sig = parsed.searchParams.get("sig") ?? "";
    expect(expires).toBe(Math.floor(expiresAt.getTime() / 1000));
    expect(verifyValidationSignature("mem-abc", expires, sig)).toBe(true);
  });

  it("usa fallback de 1 ano quando expiresAt e null", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const url = buildSignedValidationUrl("mem-xyz", null);
    const expires = Number(new URL(url).searchParams.get("expires"));
    const expected = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
    expect(expires).toBe(expected);
  });
});
