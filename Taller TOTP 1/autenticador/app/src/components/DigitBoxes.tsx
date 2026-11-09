import { StyleSheet, Text, View } from "react-native";
import { palette } from "../styles/palette";

export function DigitBoxes({ code }: { code: string }) {
  const digits = code.padEnd(6, " ").slice(0, 6).split("");
  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <View key={index} style={styles.box}><Text style={styles.digit}>{digit}</Text></View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  box: { width: 48, height: 58, borderRadius: 10, borderWidth: 2, borderColor: palette.gold, alignItems: "center", justifyContent: "center", backgroundColor: palette.white },
  digit: { fontFamily: "monospace", fontSize: 32, fontWeight: "800", color: palette.navy }
});
