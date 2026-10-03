/**
 * Falha o processo se EXPO_PUBLIC_API_URL estiver em falta em contexto EAS/CI.
 * Usado no CI; app.config.ts aplica a mesma regra no build EAS.
 */
function isAbsoluteHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const eas = process.env.EAS_BUILD === "true";
const profile = process.env.EAS_BUILD_PROFILE ?? "";
const ciPreviewOrProd =
  process.env.CI === "true" &&
  (profile === "production" || profile === "preview");

if (eas || ciPreviewOrProd) {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
  if (!url || !isAbsoluteHttpUrl(url)) {
    console.error(
      "EXPO_PUBLIC_API_URL must be a non-empty absolute http(s) URL for EAS/CI production or preview builds.",
    );
    process.exit(1);
  }
}

console.log("EXPO_PUBLIC_API_URL OK for build profile");
