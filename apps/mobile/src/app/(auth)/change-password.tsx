import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { changePasswordSchema } from "@clubos/shared";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { Button, Field, Screen, Title, Caption } from "@/components/ui";
import { t } from "@/i18n/pt";
import { spacing } from "@/lib/theme";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      Alert.alert(t.error, parsed.error.issues[0]?.message ?? t.error);
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      if (error) {
        Alert.alert(t.error, error.message ?? t.error);
        return;
      }
      await apiFetch("/me/complete-password-change", {
        method: "POST",
        body: {},
      });
      router.replace("/");
    } catch (e) {
      Alert.alert(t.error, (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: spacing.xl }}>
        <Title>{t.changePassword}</Title>
        <Caption>{t.mustChangePassword}</Caption>
        <Field
          label={t.currentPassword}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrent}
        />
        <Field
          label={t.newPassword}
          secureTextEntry
          value={newPassword}
          onChangeText={setNew}
        />
        <Field
          label={t.confirmPassword}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirm}
        />
        <Button label={t.save} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
