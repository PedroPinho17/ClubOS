import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Brightness from "expo-brightness";
import QRCode from "react-native-qrcode-svg";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { Caption, ErrorBox, Loading, Screen } from "@/components/ui";
import { colors, spacing } from "@/lib/theme";

type PortalMe = {
  member: { name: string; number: string };
  card: { qrPayload?: string | null } | null;
  organization: { name: string; primaryColor: string };
};

export default function CardScreen() {
  const q = useQuery({
    queryKey: queryKeys.portalMe,
    queryFn: () => apiFetch<PortalMe>("/portal/me"),
  });

  useEffect(() => {
    let previous: number | null = null;
    (async () => {
      try {
        previous = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
      } catch {
        /* ignore on web/sim */
      }
    })();
    return () => {
      if (previous != null) {
        Brightness.setBrightnessAsync(previous).catch(() => undefined);
      }
    };
  }, []);

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
  const payload = data.card?.qrPayload;
  const color = data.organization.primaryColor || colors.primary;

  return (
    <Screen style={styles.screen}>
      <View style={[styles.card, { backgroundColor: color }]}>
        <Text style={styles.org}>{data.organization.name}</Text>
        <Text style={styles.name}>{data.member.name}</Text>
        <Caption>
          <Text style={{ color: "#fff" }}>N.º {data.member.number}</Text>
        </Caption>
        <View style={styles.qrWrap}>
          {payload ? (
            <QRCode value={payload} size={220} backgroundColor="#fff" />
          ) : (
            <Text style={{ color: "#fff" }}>Cartao indisponivel</Text>
          )}
        </View>
        <Text style={styles.hint}>Apresente este QR na entrada</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center" },
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
  },
  org: { color: "#fff", opacity: 0.9, marginBottom: 4 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  qrWrap: {
    marginTop: spacing.lg,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  hint: { color: "#fff", marginTop: spacing.md, opacity: 0.85 },
});
