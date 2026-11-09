import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { handleCallback } from "../../services/oauthService";
import { palette } from "../../styles/palette";

export default function Callback() {
  const params = useLocalSearchParams();
  useEffect(() => {
    const url = `unisabana-auth://oauth/callback${params.state ? `?state=${params.state}&code=${params.code ?? ""}` : ""}`;
    void handleCallback(url).then((code) => router.replace(code ? "/(tabs)" : "/login")).catch(() => router.replace("/login"));
  }, [params.code, params.state]);
  return (
    <SafeAreaView style={styles.container}><Text style={styles.text}>Procesando…</Text></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
  text: { color: palette.navy, fontSize: 18, fontWeight: "800" }
});
