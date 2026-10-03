import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

/** Base URL da API NestJS (sem barra final). Em Android emulator use 10.0.2.2. */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (__DEV__) {
    if (extra?.apiUrl) return extra.apiUrl.replace(/\/$/, "");
    if (Platform.OS === "android") return "http://10.0.2.2:4000";
    return "http://localhost:4000";
  }

  throw new Error(
    "EXPO_PUBLIC_API_URL is missing. Production builds must define a public API URL at build time.",
  );
}

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
