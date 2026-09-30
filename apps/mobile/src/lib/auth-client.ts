import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "./config";

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  plugins: [
    expoClient({
      scheme: "clubos",
      storagePrefix: "clubos",
      storage: SecureStore,
    }),
  ],
});

export const { useSession, signIn, signOut } = authClient;
