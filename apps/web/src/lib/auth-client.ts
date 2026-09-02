/**
 * @module AuthClient
 * Cliente Better Auth para o browser (sessao, login, passkeys).
 * Base URL: `{NEXT_PUBLIC_API_URL}/api/auth`
 */
import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { apiBaseUrl } from "./api-base-url";

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl()}/api/auth`,
  plugins: [
    passkeyClient(),
    adminClient(),
    inferAdditionalFields({
      user: {
        mustChangePassword: {
          type: "boolean",
        },
      },
    }),
  ],
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  passkey,
  changePassword,
  updateUser,
  useListPasskeys,
  requestPasswordReset,
  resetPassword,
} = authClient;
