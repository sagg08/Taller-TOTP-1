import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { api } from "../../services/api";
import { StepUpDialog } from "../../components/StepUpDialog";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { verifyMfaThunk } from "../../state/thunks";
import { setStepUpToken } from "../../state/userSlice";
import { palette } from "../../styles/palette";

interface VaultData {
  boveda?: boolean;
  saldo?: number;
  usuario?: string;
}

function decodeExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export default function Boveda() {
  const dispatch = useAppDispatch();
  const { accessToken, elevatedToken, stepUpToken, lastVerification, loading } = useAppSelector((state) => state.user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [resendResult, setResendResult] = useState("");

  const loadVault = async () => {
    setLoadingVault(true);
    try {
      const response = await api.get<VaultData>("/api/boveda-critica");
      setVault(response.data);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403 && error.response.data?.error === "mfa_required") {
        // El reto trae su propio step_up_token: siempre fresco, sin depender del login.
        const issued = error.response.data?.step_up_token;
        if (typeof issued === "string" && issued) dispatch(setStepUpToken(issued));
        setMfaError(null);
        setDialogOpen(true);
      } else if (error instanceof AxiosError && error.response?.status === 401) {
        setDialogOpen(true);
      } else {
        setMfaError("No se pudo acceder a la bóveda.");
      }
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    const exp = decodeExp(elevatedToken);
    if (!exp) {
      setRemaining(0);
      setVault(null);
      return;
    }
    const update = () => {
      const seconds = Math.max(0, exp - Math.floor(Date.now() / 1000));
      setRemaining(seconds);
      if (seconds === 0) setVault(null);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [elevatedToken]);

  if (!accessToken) return <Redirect href="/login" />;

  const verify = async (code: string) => {
    if (!stepUpToken) {
      setMfaError("Pidiendo un reto de elevación nuevo… vuelve a introducir el código.");
      await loadVault();
      return;
    }
    setMfaError(null);
    const result = await dispatch(verifyMfaThunk({ step_up_token: stepUpToken, code }));
    if (verifyMfaThunk.fulfilled.match(result)) {
      setDialogOpen(false);
      await loadVault();
    } else if (verifyMfaThunk.rejected.match(result) && typeof result.payload === "string") {
      setMfaError(result.payload);
    }
  };

  const resendLast = async () => {
    if (!lastVerification) return;
    const started = Date.now();
    const seconds = Math.floor((started - lastVerification.at) / 1000);
    const result = await dispatch(verifyMfaThunk({
      step_up_token: lastVerification.step_up_token,
      code: lastVerification.code
    }));
    if (verifyMfaThunk.fulfilled.match(result)) {
      setResendResult(`Resultado: verificación aceptada. Transcurridos: ${seconds}s`);
    } else if (verifyMfaThunk.rejected.match(result)) {
      setResendResult(`Resultado: ${result.payload ?? "error"}. Transcurridos: ${seconds}s`);
    }
  };

  const blocked = remaining <= 0 || !elevatedToken;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Bóveda crítica</Text>
        {blocked ? (
          <View style={styles.protected}>
            <Ionicons name="lock-closed" size={48} color={palette.gold} />
            <Text style={styles.protectedTitle}>Contenido protegido con 2FA</Text>
            <Pressable style={styles.unlock} onPress={loadVault} disabled={loadingVault}>
              {loadingVault ? <ActivityIndicator color={palette.white} /> : <Text style={styles.unlockText}>Desbloquear</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.unlocked}>
            <Text style={styles.status}>Estado: desbloqueado</Text>
            <Text style={styles.timer}>Acceso elevado: {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</Text>
            <View style={styles.card}><Text style={styles.label}>Usuario</Text><Text style={styles.value}>{vault?.usuario ?? ""}</Text></View>
            <View style={styles.card}><Text style={styles.label}>Saldo protegido</Text><Text style={styles.value}>${vault?.saldo?.toLocaleString("es-CO") ?? "125.000"}</Text></View>
            <Pressable style={styles.demoHeader} onPress={() => setDemoOpen((value) => !value)}>
              <Text style={styles.demoHeaderText}>🧪 Herramientas de demostración</Text>
            </Pressable>
            {demoOpen ? (
              <View style={styles.demoBody}>
                <Pressable style={styles.resend} onPress={resendLast} disabled={loading}>
                  <Text style={styles.resendText}>Reenviar último código</Text>
                </Pressable>
                {resendResult ? <Text style={styles.result}>{resendResult}</Text> : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      <StepUpDialog visible={dialogOpen} loading={loading} error={mfaError} onVerify={verify} onCancel={() => setDialogOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { padding: 20 },
  title: { color: palette.navy, fontSize: 26, fontWeight: "900", marginBottom: 18 },
  protected: { minHeight: 280, borderRadius: 16, backgroundColor: palette.white, alignItems: "center", justifyContent: "center", padding: 24 },
  protectedTitle: { color: palette.navy, fontSize: 18, fontWeight: "800", marginVertical: 18, textAlign: "center" },
  unlock: { height: 52, minWidth: 180, borderRadius: 10, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" },
  unlockText: { color: palette.white, fontWeight: "800" },
  unlocked: {},
  status: { color: palette.success, fontWeight: "800", fontSize: 18 },
  timer: { color: palette.muted, marginTop: 5, marginBottom: 14 },
  card: { backgroundColor: palette.white, borderRadius: 12, padding: 18, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: palette.gold },
  label: { color: palette.muted },
  value: { color: palette.navy, fontSize: 22, fontWeight: "900", marginTop: 4 },
  demoHeader: { backgroundColor: palette.navy, borderRadius: 10, padding: 14 },
  demoHeaderText: { color: palette.white, fontWeight: "800" },
  demoBody: { marginTop: 10, backgroundColor: palette.white, borderRadius: 10, padding: 14 },
  resend: { height: 48, borderRadius: 8, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center" },
  resendText: { color: palette.navy, fontWeight: "800" },
  result: { color: palette.navy, marginTop: 10 }
});
