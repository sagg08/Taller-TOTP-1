import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../../styles/palette";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: palette.navy },
      headerTintColor: palette.white,
      tabBarActiveTintColor: palette.gold,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: { backgroundColor: palette.white }
    }}>
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={typeof color === "string" ? color : palette.muted} size={typeof size === "number" ? size : 24} /> }} />
      <Tabs.Screen name="codigos" options={{ title: "Códigos", tabBarIcon: ({ color, size }) => <Ionicons name="keypad" color={typeof color === "string" ? color : palette.muted} size={typeof size === "number" ? size : 24} /> }} />
      <Tabs.Screen name="boveda" options={{ title: "Bóveda", tabBarIcon: ({ color, size }) => <Ionicons name="lock-closed" color={typeof color === "string" ? color : palette.muted} size={typeof size === "number" ? size : 24} /> }} />
    </Tabs>
  );
}
