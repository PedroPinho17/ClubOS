import type { ExpoConfig } from "expo/config";
import appJson from "./app.json";

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function requiresPublicApiUrl(): boolean {
  if (process.env.EAS_BUILD === "true") return true;
  const profile = process.env.EAS_BUILD_PROFILE ?? "";
  const isProdOrPreview = profile === "production" || profile === "preview";
  return process.env.CI === "true" && isProdOrPreview;
}

function assertPublicApiUrlForBuild(): void {
  if (!requiresPublicApiUrl()) return;
  const url = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
  if (!url || !isAbsoluteHttpUrl(url)) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be set to a non-empty absolute http(s) URL for EAS/CI production or preview builds.",
    );
  }
}

assertPublicApiUrlForBuild();

const expo = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...expo,
  extra: {
    ...expo.extra,
    eas: expo.extra?.eas,
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? expo.extra?.apiUrl,
  },
});
