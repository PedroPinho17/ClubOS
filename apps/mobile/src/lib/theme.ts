import { StyleSheet } from "react-native";

export const colors = {
  bg: "#F4F7FB",
  surface: "#FFFFFF",
  primary: "#1E3A5F",
  primaryMuted: "#2E5A8F",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#B91C1C",
  success: "#15803D",
  warning: "#B45309",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 13, color: colors.muted },
});
