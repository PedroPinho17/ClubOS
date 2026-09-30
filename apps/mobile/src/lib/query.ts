import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "clubos.reactQuery",
});

export const queryKeys = {
  meContext: ["me", "context"] as const,
  meOrgs: ["me", "organizations"] as const,
  portalMe: ["portal", "me"] as const,
  portalOrg: ["portal", "organization"] as const,
  portalComms: ["portal", "communications"] as const,
  dashboard: ["dashboard", "stats"] as const,
  members: (q: string, status?: string) =>
    ["members", q, status ?? ""] as const,
  member: (id: string) => ["members", id] as const,
  devices: ["me", "devices"] as const,
};
