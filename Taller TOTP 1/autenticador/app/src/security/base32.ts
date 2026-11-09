const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function isValidBase32(value: string): boolean {
  const normalized = value.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
  if (!normalized) return false;
  return [...normalized].every((character) => alphabet.indexOf(character) >= 0);
}

export function encodeBase32(value: Uint8Array): string {
  let bits = 0;
  let buffer = 0;
  let output = "";
  for (const byte of value) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(buffer >>> (bits -= 5)) & 31];
    }
  }
  if (bits > 0) output += alphabet[(buffer << (5 - bits)) & 31];
  return output;
}

export function decodeBase32(value: string): Uint8Array {
  const normalized = value.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let buffer = 0;
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Base32 inválida: solo se permiten A-Z y 2-7.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits -= 8)) & 255);
    }
  }
  return new Uint8Array(bytes);
}
