import { createHmac } from "node:crypto";
import { base32Decode } from "./base32";

export function generateTotp(secretBase32: string, time = Date.now(), digits = 6, period = 30): string {
  const counter = Math.floor(time / 1000 / period);
  const counterBuffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", base32Decode(secretBase32)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

export function verifyTotp(secretBase32: string, token: string, time = Date.now(), window = 1): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  for (let delta = -window; delta <= window; delta++) {
    if (generateTotp(secretBase32, time + delta * 30_000) === token) return true;
  }
  return false;
}
