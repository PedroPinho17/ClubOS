import { createHmac, timingSafeEqual } from "node:crypto";
import { resolveQrSigningSecret } from "../env";

function signingSecret(): string {
  return resolveQrSigningSecret();
}

/** Assinatura HMAC-SHA256 (base64url) sobre memberId + expiração Unix. */
export function signValidationPayload(
  memberId: string,
  expiresUnix: number,
): string {
  const payload = `${memberId}:${expiresUnix}`;
  return createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
}

export function verifyValidationSignature(
  memberId: string,
  expiresUnix: number,
  sig: string,
): boolean {
  if (!Number.isFinite(expiresUnix) || expiresUnix <= 0 || !sig) return false;
  if (Math.floor(Date.now() / 1000) > expiresUnix) return false;

  const expected = signValidationPayload(memberId, expiresUnix);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** URL pública de validação com expiração e assinatura (destino do QR). */
export function buildSignedValidationUrl(
  memberId: string,
  expiresAt: Date | null,
  origin: string = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]
    .trim(),
): string {
  const fallback = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
  const expiresUnix = expiresAt
    ? Math.floor(expiresAt.getTime() / 1000)
    : fallback;
  const sig = signValidationPayload(memberId, expiresUnix);
  return `${origin}/validar/${memberId}?expires=${expiresUnix}&sig=${sig}`;
}
