import { decodeBase32 } from "./base32";
import { hmacSha1, Sha1Fn } from "./hmac";

export function secondsRemaining(now = Date.now(), period = 30): number {
  return period - (Math.floor(now / 1000) % period);
}

export async function generateTotp(
  secret: string,
  now = Date.now(),
  period = 30,
  digits = 6,
  sha1Fn?: Sha1Fn
): Promise<string> {
  const counter = Math.floor(now / 1000 / period);
  const data = new Uint8Array(8);
  const view = new DataView(data.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const digest = sha1Fn
    ? await hmacSha1(decodeBase32(secret), data, sha1Fn)
    : await hmacSha1(decodeBase32(secret), data);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % (10 ** digits)).padStart(digits, "0");
}

export function parseOtpauthUri(uri: string): { secret: string; issuer: string; account: string } | null {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "otpauth:" || parsed.host !== "totp") return null;
    const secret = parsed.searchParams.get("secret") ?? "";
    const issuer = parsed.searchParams.get("issuer") ?? "Cuenta";
    const label = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const parts = label.split(":");
    const account = parts.length > 1 ? parts.slice(1).join(":").trim() : label;
    return secret ? { secret, issuer, account } : null;
  } catch {
    return null;
  }
}
