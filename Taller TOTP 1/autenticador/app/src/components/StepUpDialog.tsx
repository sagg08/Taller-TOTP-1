import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { palette } from "../styles/palette";
import { getTotpSecret } from "../services/tokenVault";

interface Props {
  visible: boolean;
  loading: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onCancel: () => void;
}

export function StepUpDialog({ visible, loading, error, onVerify, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  useEffect(() => {
    if (visible) {
      setCode("");
      void getTotpSecret().then((secret) => setHasSecret(Boolean(secret)));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Ionicons name="lock-closed" size={42} color={palette.gold} />
          <Text style={styles.title}>Verificación reforzada</Text>
          <Text style={styles.subtitle}>Introduce el código de 6 dígitos.</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            inputMode="numeric"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={palette.muted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.verify, code.length !== 6 || loading ? styles.disabled : null]}
            disabled={code.length !== 6 || loading}
            onPress={() => onVerify(code)}
          >
            {loading ? <ActivityIndicator color={palette.white} /> : <Text style={styles.verifyText}>Verificar</Text>}
          </Pressable>
          {hasSecret ? (
            <Pressable style={styles.link} onPress={() => { onCancel(); router.push("/(tabs)/codigos"); }}>
              <Text style={styles.linkText}>Usar código de mi Authenticator</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.cancel} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,42,74,0.55)", alignItems: "center", justifyContent: "center", padding: 20 },
  dialog: { width: "100%", maxWidth: 380, borderRadius: 16, backgroundColor: palette.white, alignItems: "center", padding: 24 },
  title: { color: palette.navy, fontSize: 21, fontWeight: "900", marginTop: 10 },
  subtitle: { color: palette.muted, marginTop: 6, marginBottom: 16 },
  input: { width: "100%", height: 58, borderRadius: 10, borderWidth: 2, borderColor: palette.gold, textAlign: "center", fontSize: 26, fontWeight: "800", letterSpacing: 8, color: palette.navy, fontFamily: "monospace" },
  error: { width: "100%", color: palette.danger, textAlign: "center", marginTop: 12 },
  verify: { width: "100%", height: 52, marginTop: 16, borderRadius: 9, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 },
  verifyText: { color: palette.white, fontWeight: "800" },
  link: { marginTop: 14 },
  linkText: { color: palette.navy, fontWeight: "700", textDecorationLine: "underline" },
  cancel: { marginTop: 14 },
  cancelText: { color: palette.muted, fontWeight: "700" }
});
