import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [passkeyClient(), adminClient()],
});

export const { signIn, signOut, signUp, useSession, passkey, changePassword, updateUser, useListPasskeys } = authClient;
