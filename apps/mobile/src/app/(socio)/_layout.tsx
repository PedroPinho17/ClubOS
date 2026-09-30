import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/lib/theme";
import { t } from "@/i18n/pt";

function TabLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ fontSize: 11, color, fontWeight: "600" }}>{label}</Text>
  );
}

export default function SocioLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.home} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: t.card,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.card} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: t.payments,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.payments} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: t.notices,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.notices} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.profile} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
