import { FlatList, Pressable, Text } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { CardBox, Caption, ErrorBox, Loading, Screen } from "@/components/ui";
import { t } from "@/i18n/pt";
import { colors, typography } from "@/lib/theme";

type Notice = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export default function NoticesScreen() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.portalComms,
    queryFn: () => apiFetch<Notice[]>("/portal/communications"),
  });

  const mark = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/portal/communications/${id}/read`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portalComms }),
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
        ListEmptyComponent={<Caption>{t.noNotices}</Caption>}
        renderItem={({ item }) => (
          <Pressable onPress={() => !item.readAt && mark.mutate(item.id)}>
            <CardBox>
              <Text
                style={[
                  typography.subtitle,
                  { color: item.readAt ? colors.muted : colors.text },
                ]}
              >
                {item.subject}
              </Text>
              <Caption>
                {new Date(item.createdAt).toLocaleString("pt-PT")}
                {item.readAt ? "" : " · Novo"}
              </Caption>
              <Text style={[typography.body, { marginTop: 8 }]}>
                {item.body}
              </Text>
            </CardBox>
          </Pressable>
        )}
        refreshing={q.isFetching}
        onRefresh={() => q.refetch()}
      />
    </Screen>
  );
}
