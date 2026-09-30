import { useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import {
  Button,
  CardBox,
  Caption,
  ErrorBox,
  Field,
  Loading,
  Screen,
} from "@/components/ui";
import { t } from "@/i18n/pt";
import { colors, typography } from "@/lib/theme";

type MemberRow = {
  id: string;
  number: string;
  name: string;
  quotaSituation?: { status: string };
};

type MembersPage = {
  items: MemberRow[];
  total: number;
};

export default function MembersListScreen() {
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const q = useQuery({
    queryKey: queryKeys.members(search, overdueOnly ? "overdue" : ""),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (overdueOnly) params.set("quotaStatus", "overdue");
      params.set("limit", "50");
      return apiFetch<MembersPage>(`/members?${params.toString()}`);
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
        data={q.data?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Field
              label={t.search}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <Button
              label={overdueOnly ? "Mostrar todos" : t.overdue}
              onPress={() => setOverdueOnly((v) => !v)}
              variant="secondary"
            />
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(staff)/members/${item.id}`)}>
            <CardBox>
              <Text style={typography.subtitle}>{item.name}</Text>
              <Caption>
                N.º {item.number}
                {item.quotaSituation?.status
                  ? ` · ${item.quotaSituation.status}`
                  : ""}
              </Caption>
            </CardBox>
          </Pressable>
        )}
        refreshing={q.isFetching}
        onRefresh={() => q.refetch()}
        ListEmptyComponent={<Caption>Sem socios</Caption>}
      />
    </Screen>
  );
}
