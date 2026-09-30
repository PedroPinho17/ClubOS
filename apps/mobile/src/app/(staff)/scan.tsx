import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { apiFetch } from "@/lib/api";
import { Button, Caption, Screen, Title } from "@/components/ui";
import { t } from "@/i18n/pt";
import { colors, spacing, typography } from "@/lib/theme";

type ScanResult = {
  memberId: string;
  member: { name: string; number: string; active: boolean };
  status: string;
  organization: { name: string };
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onBarcode(payload: string) {
    if (locked) return;
    setLocked(true);
    setError(null);
    try {
      const data = await apiFetch<ScanResult>("/validation/scan", {
        method: "POST",
        body: { payload },
      });
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setLocked(false), 1500);
    }
  }

  if (!permission?.granted) {
    return (
      <Screen>
        <Title>{t.scan}</Title>
        <Caption>E necessario acesso a camara.</Caption>
        <Button label="Permitir camara" onPress={requestPermission} />
      </Screen>
    );
  }

  if (result) {
    const ok = result.status !== "overdue" && result.member.active;
    return (
      <Screen>
        <View
          style={[
            styles.result,
            { backgroundColor: ok ? colors.success : colors.danger },
          ]}
        >
          <Text style={styles.resultTitle}>{ok ? "Valido" : "Atencao"}</Text>
          <Text style={styles.resultBody}>{result.member.name}</Text>
          <Text style={styles.resultBody}>N.º {result.member.number}</Text>
          <Text style={styles.resultBody}>{result.status}</Text>
        </View>
        <Button
          label="Ver ficha"
          onPress={() => router.push(`/(staff)/members/${result.memberId}`)}
        />
        <Button
          label="Ler outro"
          variant="secondary"
          onPress={() => {
            setResult(null);
            setLocked(false);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onBarcode(data)}
      />
      <View style={styles.overlay}>
        <Title>
          <Text style={{ color: "#fff" }}>{t.scan}</Text>
        </Title>
        {error ? (
          <Text style={{ color: "#fecaca", marginTop: 8 }}>{error}</Text>
        ) : (
          <Caption>
            <Text style={{ color: "#fff" }}>Aponte ao QR do cartao</Text>
          </Caption>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
  },
  result: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  resultTitle: { ...typography.title, color: "#fff" },
  resultBody: { ...typography.body, color: "#fff", marginTop: 4 },
});
