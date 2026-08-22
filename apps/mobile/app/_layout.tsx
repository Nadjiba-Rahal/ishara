import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth-context";
import { colors } from "../lib/styles";

const COLORS = {
  primary: colors.primary,
  muted: colors.muted,
  border: colors.border,
  surface: colors.surface
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "800" },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: { borderTopColor: COLORS.border, backgroundColor: COLORS.surface, height: 64, paddingBottom: 8 },
          tabBarLabelStyle: { fontWeight: "700" }
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="dictionary/index" options={{ title: "Dictionary" }} />
        <Tabs.Screen name="translate" options={{ title: "Translate" }} />
        <Tabs.Screen name="practice" options={{ title: "Practice" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />
        <Tabs.Screen name="dictionary/[id]" options={{ href: null }} />
        <Tabs.Screen name="camera-preview" options={{ href: null, title: "Camera preview" }} />
        <Tabs.Screen name="auth/login" options={{ href: null }} />
        <Tabs.Screen name="auth/register" options={{ href: null }} />
      </Tabs>
    </AuthProvider>
  );
}
