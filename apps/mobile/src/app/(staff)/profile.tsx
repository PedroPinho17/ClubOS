import { Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { Button, Screen, Title } from "@/components/ui";
import { t } from "@/i18n/pt";

export default function StaffProfileScreen() {
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
        <Button label={t.logout} onPress={onLogout} variant="secondary" />
        <Button label={t.deleteAccount} onPress={onDelete} variant="danger" />
      </ScrollView>
    </Screen>
  );
}
