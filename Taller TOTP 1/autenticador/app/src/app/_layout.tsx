import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../state/store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { restoreSessionThunk } from "../state/thunks";
import { palette } from "../styles/palette";

function AppShell() {
  const [restoring, setRestoring] = useState(true);
  useEffect(() => {
    let active = true;
    void store.dispatch(restoreSessionThunk()).finally(() => {
      if (active) setRestoring(false);
    });
    return () => { active = false; };
  }, []);

  if (restoring) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={palette.gold} />
        <Text style={styles.loadingText}>Restaurando sesión…</Text>
      </SafeAreaView>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scanner" options={{ presentation: "modal", title: "Escanear QR" }} />
      <Stack.Screen name="oauth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}><AppShell /></Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
  loadingText: { marginTop: 12, color: palette.navy, fontWeight: "700" }
});
