import { FlatList, Pressable, Text } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, setActiveOrganizationId } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import {
  CardBox,
  Caption,
  ErrorBox,
  Loading,
  Screen,
  Title,
} from "@/components/ui";
import { t } from "@/i18n/pt";
import { colors, typography } from "@/lib/theme";

type Org = {
  id: string;
  name: string;
  orgRole: string;
};

export default function OrgPickerScreen() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.meOrgs,
    queryFn: () => apiFetch<Org[]>("/me/organizations"),
  });
  const ctx = useQuery({
    queryKey: queryKeys.meContext,
    queryFn: () => apiFetch<{ organizationId: string }>("/me/context"),
  });

  const select = useMutation({
    mutationFn: async (organizationId: string) => {
      await apiFetch("/me/active-organization", {
        method: "POST",
        body: { organizationId },
      });
      await setActiveOrganizationId(organizationId);
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  if (q.isLoading && !q.data) return <Loading />;
  if (q.isError && !q.data) {
    return (
      <ErrorBox
        message={(q.error as Error).message}
        onRetry={() => q.refetch()}
      />
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <FlatList
        data={q.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Title>{t.orgPicker}</Title>}
        renderItem={({ item }) => {
          const active = item.id === ctx.data?.organizationId;
          return (
            <Pressable onPress={() => select.mutate(item.id)}>
              <CardBox>
                <Text
                  style={[
                    typography.subtitle,
                    { color: active ? colors.primary : colors.text },
                  ]}
                >
                  {item.name}
                  {active ? " ✓" : ""}
                </Text>
                <Caption>{item.orgRole}</Caption>
              </CardBox>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
