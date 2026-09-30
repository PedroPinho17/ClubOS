import { useEffect, useState } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { registerForPushNotifications } from "@/lib/notifications";
import { queryKeys } from "@/lib/query";
import { Button, CardBox, Caption, Screen, Title } from "@/components/ui";
import { t } from "@/i18n/pt";
import { spacing, typography } from "@/lib/theme";

const BIO_KEY = "clubos.biometrics";

export default function ProfileScreen() {
  const [bio, setBio] = useState(false);
  const session = useQuery({
    queryKey: queryKeys.meContext,
    queryFn: () => apiFetch<{ effectiveRole: string }>("/me/context"),
  });

  useEffect(() => {
    AsyncStorage.getItem(BIO_KEY).then((v) => setBio(v === "1"));
    registerForPushNotifications().catch(() => undefined);
  }, []);

  async function toggleBio(value: boolean) {
    if (value) {
      const ok = await LocalAuthentication.authenticateAsync({
        promptMessage: t.biometrics,
      });
      if (!ok.success) return;
    }
    setBio(value);
    await AsyncStorage.setItem(BIO_KEY, value ? "1" : "0");
  }

  async function onLogout() {
    await authClient.signOut();
    router.replace("/(auth)/login");
  }

  async function onDelete() {
    Alert.alert(t.deleteAccount, t.deleteAccountConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteAccount,
        style: "destructive",
        onPress: async () => {
          try {
            const res = await apiFetch<{ message: string }>(
              "/me/account-deletion",
              {
                method: "POST",
                body: {},
              },
            );
            Alert.alert(t.appName, res.message);
          } catch (e) {
            Alert.alert(t.error, (e as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView>
        <Title>{t.profile}</Title>
        <Caption>Papel: {session.data?.effectiveRole ?? "—"}</Caption>

        <CardBox>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={typography.body}>{t.biometrics}</Text>
            <Switch value={bio} onValueChange={toggleBio} />
          </View>
        </CardBox>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button label={t.logout} onPress={onLogout} variant="secondary" />
          <Button label={t.deleteAccount} onPress={onDelete} variant="danger" />
        </View>
      </ScrollView>
    </Screen>
  );
}
