import { createHash, timingSafeEqual } from "node:crypto";

export function generatePkceCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkceVerifier(verifier: string, challenge: string): boolean {
  const actual = generatePkceCodeChallenge(verifier);
  const a = Buffer.from(actual);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}
