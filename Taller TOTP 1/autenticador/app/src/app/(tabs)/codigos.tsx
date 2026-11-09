import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { isValidBase32 } from "../../security/base32";
import { getTotpSecret, getTotpQrAccount, saveTotpSecret, deleteTotpSecret, deleteTotpQrAccount } from "../../services/tokenVault";
import { useTotpCode } from "../../hooks/useTotpCode";
import { DigitBoxes } from "../../components/DigitBoxes";
import { PieTimer } from "../../components/PieTimer";
import { palette } from "../../styles/palette";
import { useAppSelector } from "../../state/hooks";

export default function Codigos() {
  const [secret, setSecret] = useState<string | null>(null);
  const [seed, setSeed] = useState("");
  const [error, setError] = useState("");
  const [qrAccount, setQrAccount] = useState<string | null>(null);
  const user = useAppSelector((state) => state.user.user);
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const { code, remaining } = useTotpCode(secret);

  // Al foco, no al montaje: el scanner es un modal del Stack padre y no desmonta esta pestana.
  useFocusEffect(useCallback(() => {
    let active = true;
    void getTotpSecret().then((stored) => { if (active) setSecret(stored); });
    void getTotpQrAccount().then((stored) => { if (active) setQrAccount(stored); });
    return () => { active = false; };
  }, []));

  const saveSeed = async () => {
    if (!isValidBase32(seed)) {
      setError("Base32 inválida: solo se permiten A-Z y 2-7.");
      return;
    }
    const normalized = seed.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
    await saveTotpSecret(normalized);
    setSecret(normalized);
    setError("");
  };

  const clear = async () => {
    await deleteTotpSecret();
    await deleteTotpQrAccount();
    setSecret(null);
    setQrAccount(null);
    setSeed("");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
    <View style={styles.container}>
      {!secret ? (
        <>
          <Text style={styles.title}>Configurar autenticador</Text>
          <Pressable style={styles.scanButton} onPress={() => router.push("/scanner")}>
            <Text style={styles.scanText}>Escanear QR</Text>
          </Pressable>
          <Text style={styles.or}>o pegar semilla Base32</Text>
          <TextInput value={seed} onChangeText={setSeed} autoCapitalize="characters"
            placeholder="JBSWY3DPEHPK3PXP" style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.saveButton} onPress={saveSeed}><Text style={styles.saveText}>Guardar cuenta</Text></Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Banco Seguro</Text>
          <Text style={styles.account}>
            {accessToken && user
              ? user
              : qrAccount
                ? `Cuenta del QR · ${qrAccount}`
                : "Cuenta manual Base32"}
          </Text>
          <DigitBoxes code={code} />
          <View style={styles.timer}><PieTimer remaining={remaining} /></View>
          <Text style={styles.remaining}>{remaining} segundos</Text>
          <Pressable style={styles.clearButton} onPress={clear}><Text style={styles.clearText}>Borrar la cuenta</Text></Pressable>
        </>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { flex: 1, backgroundColor: palette.background, padding: 24, alignItems: "center" },
  title: { color: palette.navy, fontSize: 24, fontWeight: "900", marginTop: 20 },
  account: { color: palette.muted, marginVertical: 18 },
  scanButton: { marginTop: 22, width: "100%", height: 54, borderRadius: 10, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" },
  scanText: { color: palette.white, fontWeight: "800", fontSize: 16 },
  or: { color: palette.muted, marginVertical: 14 },
  input: { width: "100%", backgroundColor: palette.white, borderRadius: 8, borderWidth: 1, borderColor: "#CBD5E1", padding: 14, fontFamily: "monospace" },
  error: { color: palette.danger, marginTop: 8 },
  saveButton: { width: "100%", height: 52, borderRadius: 10, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center", marginTop: 16 },
  saveText: { color: palette.navy, fontWeight: "800" },
  timer: { marginTop: 24 },
  remaining: { color: palette.muted, marginTop: 5 },
  clearButton: { marginTop: 20, borderWidth: 1, borderColor: palette.danger, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  clearText: { color: palette.danger, fontWeight: "800" }
});
