import * as Crypto from "expo-crypto";

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  let base64 = "";
  if (typeof globalThis.btoa === "function") {
    base64 = globalThis.btoa(binary);
  } else {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let index = 0;
    while (index < binary.length) {
      const first = binary.charCodeAt(index++);
      const second = index < binary.length ? binary.charCodeAt(index++) : NaN;
      const third = index < binary.length ? binary.charCodeAt(index++) : NaN;
      base64 += chars[first >> 2];
      base64 += chars[((first & 3) << 4) | (Number.isNaN(second) ? 0 : second >> 4)];
      base64 += Number.isNaN(second) ? "=" : chars[((second & 15) << 2) | (Number.isNaN(third) ? 0 : third >> 6)];
      base64 += Number.isNaN(third) ? "=" : chars[third & 63];
    }
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createPkceVerifier(): string {
  return base64UrlEncode(Crypto.getRandomBytes(48));
}

export async function createPkceChallenge(verifier: string): Promise<string> {
  const bytes = new TextEncoder().encode(verifier);
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return base64UrlEncode(new Uint8Array(hash));
}

export function createState(): string {
  return base64UrlEncode(Crypto.getRandomBytes(16));
}
