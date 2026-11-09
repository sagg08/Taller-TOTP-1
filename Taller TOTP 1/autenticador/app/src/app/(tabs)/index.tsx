import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useAppSelector } from "../../state/hooks";
import { getRefreshToken } from "../../services/tokenVault";
import { logout } from "../../services/oauthService";
import { api, refreshCount } from "../../services/api";
import { palette } from "../../styles/palette";

function decodeExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export default function Inicio() {
  const { accessToken, user } = useAppSelector((state) => state.user);
  const [hasRefresh, setHasRefresh] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [requestResults, setRequestResults] = useState<string[]>([]);

  useEffect(() => {
    void getRefreshToken().then((token) => setHasRefresh(Boolean(token)));
    if (!accessToken) return;
    const update = () => {
      const exp = decodeExp(accessToken);
      setRemaining(exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : null);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (!accessToken) return <Redirect href="/login" />;

  const launchSimultaneous = async () => {
    const results = await Promise.allSettled([
      api.get("/api/perfil"),
      api.get("/api/perfil"),
      api.get("/api/perfil")
    ]);
    setRequestResults(results.map((result, index) => `${index + 1}: ${result.status === "fulfilled" ? "✅" : "❌"}`));
  };

  const revokeRefresh = async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      setRequestResults(["No hay refresh token local."]);
      return;
    }
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.40.11:4200"}/auth/logout`, { refresh_token: refreshToken });
      setRequestResults(["Refresh revocado en el servidor. El token local sigue guardado."]);
    } catch {
      setRequestResults(["❌ No se pudo revocar el refresh."]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.email}>{user ?? "Usuario autenticado"}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesión</Text>
          <Text style={styles.label}>Access token</Text>
          <Text style={styles.value}>{accessToken.slice(0, 16)}...</Text>
          <Text style={styles.label}>Refresh token</Text>
          <Text style={[styles.value, { color: hasRefresh ? palette.success : palette.danger }]}>{hasRefresh ? "Guardado ✅" : "Ausente ❌"}</Text>
          <Text style={styles.label}>Tiempo del access token</Text>
          <Text style={styles.value}>{remaining === null ? "Sin exp" : `${remaining}s`}</Text>
        </View>
        <Pressable style={styles.button} onPress={async () => { await logout(); router.replace("/login"); }}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </Pressable>
        <Pressable style={styles.demoHeader} onPress={() => setDemoOpen((value) => !value)}>
          <Text style={styles.demoHeaderText}>🧪 Herramientas de demostración</Text>
        </Pressable>
        {demoOpen ? (
          <View style={styles.demoBody}>
            <Pressable style={styles.demoButton} onPress={launchSimultaneous}><Text style={styles.demoButtonText}>Lanzar 3 peticiones simultáneas</Text></Pressable>
            <Pressable style={[styles.demoButton, styles.demoButtonSecondary]} onPress={revokeRefresh}><Text style={styles.demoButtonTextSecondary}>Revocar refresh en el servidor</Text></Pressable>
            <Text style={styles.demoResult}>{requestResults.join("\n")}</Text>
            <Text style={styles.demoResult}>Renovaciones realizadas: {refreshCount}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { padding: 20 },
  email: { color: palette.navy, fontSize: 22, fontWeight: "800", marginVertical: 18 },
  card: { backgroundColor: palette.white, borderRadius: 12, padding: 18, borderLeftWidth: 5, borderLeftColor: palette.gold },
  cardTitle: { color: palette.navy, fontSize: 20, fontWeight: "800", marginBottom: 12 },
  label: { color: palette.muted, marginTop: 10 },
  value: { color: palette.navy, fontFamily: "monospace", fontWeight: "700", marginTop: 2 },
  button: { marginTop: 22, height: 52, borderRadius: 10, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" },
  buttonText: { color: palette.white, fontWeight: "800", fontSize: 16 },
  demoHeader: { marginTop: 18, borderRadius: 10, backgroundColor: palette.navy, padding: 14 },
  demoHeaderText: { color: palette.white, fontWeight: "800", textAlign: "center" },
  demoBody: { marginTop: 8, borderRadius: 10, backgroundColor: palette.white, padding: 14 },
  demoButton: { height: 48, borderRadius: 8, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  demoButtonSecondary: { backgroundColor: palette.navy },
  demoButtonText: { color: palette.navy, fontWeight: "800" },
  demoButtonTextSecondary: { color: palette.white, fontWeight: "800" },
  demoResult: { color: palette.navy, marginTop: 8 }
});
