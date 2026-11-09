import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import axios from "axios";
import { useAppSelector } from "../state/hooks";
import { setSimulateCsrf, startLogin } from "../services/oauthService";
import { palette } from "../styles/palette";

export default function Login() {
  const { loading, error } = useAppSelector((state) => state.user);
  const [connection, setConnection] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [simulateState, setSimulateState] = useState(false);

  const login = async () => {
    try {
      const code = await startLogin();
      if (code) router.replace("/(tabs)");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo iniciar sesión.";
      setConnection(message);
    }
  };

  const testConnection = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.40.11:4200"}/health`);
      setConnection(response.status === 200 ? "Conexión correcta ✅" : "Sin conexión ❌");
    } catch {
      setConnection("Sin conexión ❌");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brand}><Text style={styles.logo}>E</Text></View>
      <Text style={styles.welcome}>Bienvenido a</Text>
      <Text style={styles.title}>Escudo</Text>
      <Pressable style={styles.primary} onPress={login} disabled={loading}>
        {loading ? <ActivityIndicator color={palette.navy} /> : <Text style={styles.primaryText}>Iniciar sesión</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.secondary} onPress={() => router.push("/(tabs)/codigos")}><Text style={styles.secondaryText}>Ver mis códigos</Text></Pressable>
      <Pressable onPress={testConnection}><Text style={styles.connection}>Probar conexión</Text></Pressable>
      {connection ? <Text style={styles.connectionStatus}>{connection}</Text> : null}
      <Pressable style={styles.demoHeader} onPress={() => setDemoOpen((value) => !value)}>
        <Text style={styles.demoHeaderText}>🧪 Herramientas de demostración</Text>
      </Pressable>
      {demoOpen ? (
        <View style={styles.demoBody}>
          <Text style={styles.switchText}>Simular state alterado</Text>
          <Switch value={simulateState} onValueChange={(value) => { setSimulateState(value); setSimulateCsrf(value); }} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, alignItems: "center", justifyContent: "center", padding: 24 },
  brand: { width: 82, height: 82, borderRadius: 24, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logo: { color: palette.gold, fontSize: 44, fontWeight: "900" },
  welcome: { color: palette.muted, fontSize: 16 },
  title: { color: palette.navy, fontSize: 38, fontWeight: "900", marginBottom: 32 },
  primary: { width: "100%", height: 54, borderRadius: 10, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center" },
  primaryText: { color: palette.navy, fontSize: 17, fontWeight: "800" },
  secondary: { width: "100%", height: 54, borderRadius: 10, borderWidth: 2, borderColor: palette.navy, alignItems: "center", justifyContent: "center", marginTop: 12 },
  secondaryText: { color: palette.navy, fontSize: 16, fontWeight: "800" },
  connection: { marginTop: 18, color: palette.navy, fontWeight: "700" },
  connectionStatus: { marginTop: 6, color: palette.muted },
  error: { marginTop: 10, color: palette.danger, textAlign: "center" }
  ,
  demoHeader: { width: "100%", marginTop: 18, padding: 13, borderRadius: 8, backgroundColor: palette.navy },
  demoHeaderText: { color: palette.white, fontWeight: "800", textAlign: "center" },
  demoBody: { width: "100%", marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: palette.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchText: { color: palette.navy, fontWeight: "700" }
});
