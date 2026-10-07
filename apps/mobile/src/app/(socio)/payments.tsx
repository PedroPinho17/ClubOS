import { Alert, FlatList, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiFetch, apiFetchBlob } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import {
  Button,
  CardBox,
  ErrorBox,
  Loading,
  Screen,
  Caption,
} from "@/components/ui";
import { t } from "@/i18n/pt";
import { typography } from "@/lib/theme";

type Payment = {
  id: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string | null;
};

type PortalMe = { payments: Payment[] };

export default function PaymentsScreen() {
  const q = useQuery({
    queryKey: queryKeys.portalMe,
    queryFn: () => apiFetch<PortalMe>("/portal/me"),
  });

  async function downloadReceipt(id: string) {
    try {
      const blob = await apiFetchBlob(`/portal/payments/${id}/receipt`);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result.split(",")[1];
          if (!b64) reject(new Error("Falha a ler PDF"));
          else resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const path = `${FileSystem.cacheDirectory}recibo-${id}.pdf`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: "base64",
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "application/pdf" });
      } else {
        Alert.alert(t.appName, `Recibo guardado em ${path}`);
      }
    } catch (e) {
      Alert.alert(t.error, (e as Error).message);
    }
  }

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
        data={q.data!.payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Caption>Sem pagamentos</Caption>}
        renderItem={({ item }) => (
          <CardBox>
            <Text style={typography.subtitle}>{item.amount} EUR</Text>
            <Caption>
              {item.status} · {item.method}
              {item.paidAt
                ? ` · ${new Date(item.paidAt).toLocaleDateString("pt-PT")}`
                : ""}
            </Caption>
            {item.status === "PAID" ? (
              <View style={{ marginTop: 12 }}>
                <Button
                  label={t.shareReceipt}
                  onPress={() => downloadReceipt(item.id)}
                  variant="secondary"
                />
              </View>
            ) : null}
          </CardBox>
        )}
        refreshing={q.isFetching}
        onRefresh={() => q.refetch()}
      />
    </Screen>
  );
}
