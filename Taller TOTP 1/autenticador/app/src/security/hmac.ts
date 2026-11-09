import { CryptoDigestAlgorithm, digest } from "expo-crypto";

export type Sha1Fn = (bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>;

export async function sha1(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digestBytes = await digest(CryptoDigestAlgorithm.SHA1, copy);
  return new Uint8Array(digestBytes);
}

export async function hmacSha1(
  key: Uint8Array,
  message: Uint8Array,
  sha1Fn: Sha1Fn = sha1
): Promise<Uint8Array> {
  let normalizedKey = key.length > 64 ? await sha1Fn(key) : key;
  if (normalizedKey.length < 64) {
    const padded = new Uint8Array(64);
    padded.set(normalizedKey);
    normalizedKey = padded;
  }
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let index = 0; index < 64; index++) {
    ipad[index] = normalizedKey[index] ^ 0x36;
    opad[index] = normalizedKey[index] ^ 0x5c;
  }
  const inner = new Uint8Array(ipad.length + message.length);
  inner.set(ipad);
  inner.set(message, ipad.length);
  const innerHash = await sha1Fn(inner);
  const outer = new Uint8Array(opad.length + innerHash.length);
  outer.set(opad);
  outer.set(innerHash, opad.length);
  return new Uint8Array(await sha1Fn(outer));
}
