import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPaymentSchema, paymentMethodSchema } from "@clubos/shared";
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
  Title,
} from "@/components/ui";
import { t } from "@/i18n/pt";
import { typography } from "@/lib/theme";

type MemberDetail = {
  id: string;
  name: string;
  number: string;
  email: string | null;
  quotaPlan: { id: string; name: string; amount: string } | null;
  quotaSituation?: { status: string; nextDueDate: string | null };
  payments?: {
    id: string;
    amount: string;
    status: string;
    paidAt: string | null;
  }[];
};

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");

  const q = useQuery({
    queryKey: queryKeys.member(id!),
    queryFn: () => apiFetch<MemberDetail>(`/members/${id}`),
    enabled: !!id,
  });

  const pay = useMutation({
    mutationFn: async () => {
      const parsed = createPaymentSchema.safeParse({
        memberId: id,
        quotaPlanId: q.data?.quotaPlan?.id,
        amount: amount ? Number(amount.replace(",", ".")) : undefined,
        method: paymentMethodSchema.parse(method),
        reference: reference || undefined,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? t.error);
      }
      return apiFetch("/payments", { method: "POST", body: parsed.data });
    },
    onSuccess: () => {
      Alert.alert(t.appName, "Pagamento registado");
      qc.invalidateQueries({ queryKey: queryKeys.member(id!) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (e: Error) => Alert.alert(t.error, e.message),
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

  const m = q.data!;

  return (
    <Screen>
      <ScrollView>
        <Title>{m.name}</Title>
        <Caption>
          N.º {m.number}
          {m.email ? ` · ${m.email}` : ""}
        </Caption>
        <CardBox>
          <Text style={typography.subtitle}>Quota</Text>
          <Caption>
            {m.quotaSituation?.status ?? "—"}
            {m.quotaPlan
              ? ` · ${m.quotaPlan.name} (${m.quotaPlan.amount} EUR)`
              : ""}
          </Caption>
        </CardBox>

        <Text style={typography.subtitle}>{t.registerPayment}</Text>
        <Field
          label={t.amount}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder={m.quotaPlan?.amount ?? ""}
        />
        <Field
          label={t.method}
          value={method}
          onChangeText={setMethod}
          placeholder="CASH | TRANSFER | CARD | MBWAY | OTHER"
          autoCapitalize="characters"
        />
        <Field
          label={t.reference}
          value={reference}
          onChangeText={setReference}
        />
        <Button
          label={t.registerPayment}
          onPress={() => pay.mutate()}
          loading={pay.isPending}
        />
      </ScrollView>
    </Screen>
  );
}
