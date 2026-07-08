'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useSession } from '@/lib/auth-client';

/** Arranca o fetch de sessão cedo, antes dos layouts protegidos montarem. */
function SessionWarmup() {
  useSession();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <SessionWarmup />
      {children}
    </QueryClientProvider>
  );
}
