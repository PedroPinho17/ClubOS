import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { Loading } from "@/components/ui";
import { isStaffRole } from "@clubos/shared";

type MeContext = {
  organizationId: string | null;
  effectiveRole: string | null;
};

export default function Index() {
  const { data: session, isPending } = useSession();
  const user = session?.user as { mustChangePassword?: boolean } | undefined;

  const context = useQuery({
    queryKey: queryKeys.meContext,
    queryFn: () => apiFetch<MeContext>("/me/context"),
    enabled: !!session?.user,
  });

  if (isPending || (session?.user && context.isLoading)) {
    return <Loading />;
  }

  if (!session?.user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.mustChangePassword) {
    return <Redirect href="/(auth)/change-password" />;
  }

  const role = context.data?.effectiveRole;
  if (isStaffRole(role)) {
    return <Redirect href="/(staff)" />;
  }
  return <Redirect href="/(socio)" />;
}
