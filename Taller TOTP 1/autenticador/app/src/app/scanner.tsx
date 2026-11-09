import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { parseOtpauthUri } from "../security/totp";
import { saveTotpQrAccount, saveTotpSecret } from "../services/tokenVault";
import { palette } from "../styles/palette";

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/codigos");
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Se necesita permiso para usar la cámara.</Text>
        <Pressable style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>Conceder permiso</Text></Pressable>
      </SafeAreaView>
    );
  }
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={async (event) => {
          if (handled.current) return;
          const parsed = parseOtpauthUri(event.data);
          if (!parsed) return;
          handled.current = true;
          await saveTotpSecret(parsed.secret);
          await saveTotpQrAccount(parsed.account);
          close();
        }} />
      <Pressable style={styles.cancel} onPress={close}><Text style={styles.buttonText}>Cancelar</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" },
  message: { color: palette.white, marginBottom: 14, textAlign: "center" },
  button: { backgroundColor: palette.gold, padding: 14, borderRadius: 8 },
  cancel: { position: "absolute", bottom: 40, backgroundColor: palette.navy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: palette.white, fontWeight: "800" }
});
