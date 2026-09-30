import { RefreshControl, ScrollView, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
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
import { spacing, typography } from "@/lib/theme";

type Stats = {
  membersTotal?: number;
  membersActive?: number;
  overdue?: number;
  dueSoon?: number;
  revenueMonth?: number | string;
  totalMembers?: number;
  activeMembers?: number;
  overdueMembers?: number;
  dueSoonMembers?: number;
  monthRevenue?: number | string;
};

export default function StaffDashboard() {
  const q = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiFetch<Stats>("/dashboard/stats"),
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

  const s = q.data!;
  const rows = [
    ["Socios", s.membersTotal ?? s.totalMembers ?? "—"],
    ["Ativos", s.membersActive ?? s.activeMembers ?? "—"],
    ["Em atraso", s.overdue ?? s.overdueMembers ?? "—"],
    ["A vencer", s.dueSoon ?? s.dueSoonMembers ?? "—"],
    ["Receita", s.revenueMonth ?? s.monthRevenue ?? "—"],
  ] as const;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={q.isFetching}
            onRefresh={() => q.refetch()}
          />
        }
      >
        <Title>{t.dashboard}</Title>
        {rows.map(([label, value]) => (
          <CardBox key={label}>
            <Caption>{label}</Caption>
            <Text style={typography.title}>{String(value)}</Text>
          </CardBox>
        ))}
      </ScrollView>
    </Screen>
  );
}
