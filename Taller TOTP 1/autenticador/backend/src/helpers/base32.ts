const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(input: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits -= 5)) & 31];
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid Base32 input");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits -= 8)) & 255);
    }
  }
  return Buffer.from(bytes);
}
