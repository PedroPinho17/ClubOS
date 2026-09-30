import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/lib/theme";
import { t } from "@/i18n/pt";

function TabLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ fontSize: 11, color, fontWeight: "600" }}>{label}</Text>
  );
}

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.dashboard,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.dashboard} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="members/index"
        options={{
          title: t.members,
          href: "/(staff)/members",
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.members} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="members/[id]"
        options={{ href: null, title: "Socio" }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t.scan,
          tabBarLabel: ({ color }) => (
            <TabLabel label={t.scan} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="org-picker"
        options={{
          title: t.orgPicker,
          tabBarLabel: ({ color }) => (
            <TabLabel label="Clube" color={String(color)} />
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
