import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Redirect, router } from "expo-router";
import { loginSchema } from "@clubos/shared";
import { authClient, useSession } from "@/lib/auth-client";
import { Button, Field, Screen, Title, Caption } from "@/components/ui";
import { t } from "@/i18n/pt";
import { spacing } from "@/lib/theme";

export default function LoginScreen() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (session?.user) {
    return <Redirect href="/" />;
  }

  async function onLogin() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      Alert.alert(t.error, parsed.error.issues[0]?.message ?? t.error);
      return;
    }
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        Alert.alert(t.error, error.message ?? "Credenciais invalidas");
        return;
      }
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      Alert.alert(t.error, "Indique o email");
      return;
    }
    setLoading(true);
    try {
      const client = authClient as typeof authClient & {
        requestPasswordReset?: (args: {
          email: string;
          redirectTo?: string;
        }) => Promise<unknown>;
        forgetPassword?: (args: {
          email: string;
          redirectTo?: string;
        }) => Promise<unknown>;
      };
      if (client.requestPasswordReset) {
        await client.requestPasswordReset({
          email: email.trim(),
          redirectTo: "clubos://reset-password",
        });
      } else if (client.forgetPassword) {
        await client.forgetPassword({
          email: email.trim(),
          redirectTo: "clubos://reset-password",
        });
      } else {
        await fetch(
          `${(await import("@/lib/config")).getApiBaseUrl()}/api/auth/request-password-reset`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              redirectTo: "clubos://reset-password",
            }),
          },
        );
      }
      Alert.alert(t.appName, t.resetSent);
    } catch (e) {
      Alert.alert(t.error, (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ paddingTop: spacing.xl * 2 }}>
          <Title>{t.appName}</Title>
          <Caption>Portal do socio e staff leve</Caption>
          <Field
            label={t.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            style={{ marginTop: spacing.lg }}
          />
          <Field
            label={t.password}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button label={t.login} onPress={onLogin} loading={loading} />
          <Button
            label={t.forgotPassword}
            onPress={onForgot}
            variant="secondary"
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
