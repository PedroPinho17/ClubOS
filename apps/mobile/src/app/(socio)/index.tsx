import { RefreshControl, ScrollView, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import {
  Body,
  Caption,
  CardBox,
  ErrorBox,
  Loading,
  Screen,
  Title,
} from "@/components/ui";
import { t } from "@/i18n/pt";
import { colors, spacing, typography } from "@/lib/theme";

type PortalMe = {
  member: { name: string; number: string; planName: string | null };
  quotaSituation: {
    status: string;
    nextDueDate: string | null;
    daysUntilDue?: number | null;
    daysOverdue?: number | null;
  };
  organization: { name: string; primaryColor: string };
};

const statusLabel: Record<string, string> = {
  up_to_date: "Em dia",
  due_soon: "A vencer",
  overdue: "Em atraso",
  no_plan: "Sem plano",
  pending: "Pendente",
};

export default function SocioHome() {
  const q = useQuery({
    queryKey: queryKeys.portalMe,
    queryFn: () => apiFetch<PortalMe>("/portal/me"),
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

  const data = q.data!;
  const status = data.quotaSituation.status;

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
        <Caption>{data.organization.name}</Caption>
        <Title>{data.member.name}</Title>
        <Caption>N.º {data.member.number}</Caption>

        <CardBox>
          <Text style={typography.subtitle}>{t.quotaStatus}</Text>
          <Text
            style={[
              typography.title,
              {
                color:
                  status === "overdue"
                    ? colors.danger
                    : status === "due_soon"
                      ? colors.warning
                      : colors.success,
                marginTop: 8,
              },
            ]}
          >
            {statusLabel[status] ?? status}
          </Text>
          {data.quotaSituation.nextDueDate ? (
            <Body>
              {t.nextDue}:{" "}
              {new Date(data.quotaSituation.nextDueDate).toLocaleDateString(
                "pt-PT",
              )}
            </Body>
          ) : null}
          {data.member.planName ? (
            <Caption>Plano: {data.member.planName}</Caption>
          ) : null}
        </CardBox>
      </ScrollView>
    </Screen>
  );
}
