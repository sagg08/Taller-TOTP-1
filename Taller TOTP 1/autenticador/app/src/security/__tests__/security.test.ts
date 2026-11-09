import { createHash, createHmac } from "node:crypto";
import { decodeBase32, isValidBase32 } from "../base32";
import { generateTotp, parseOtpauthUri, secondsRemaining } from "../totp";
import { hmacSha1 } from "../hmac";
import { base64UrlEncode } from "../pkce";

const sha1WithNode = (bytes: Uint8Array) =>
  new Uint8Array(createHash("sha1").update(bytes).digest());

describe("Base32", () => {
  it("accepts lowercase, spaces and padding", () => {
    expect(isValidBase32("gez dgnbv gy3tq ojq===")).toBe(true);
    expect(decodeBase32("GEZD GNBVGY3TQOJQ")).toBeInstanceOf(Uint8Array);
  });

  it("rejects invalid characters", () => {
    expect(isValidBase32("NOT-VALID!")).toBe(false);
  });
});

describe("RFC 6238 SHA-1 vectors", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const vectors = [
    [59_000, "94287082"],
    [1111111100000, "07081804"],
    [1111111111000, "14050471"],
    [1234567890000, "89005924"],
    [2000000000000, "69279037"],
    [20000000000000, "65353130"]
  ] as const;

  it.each(vectors)("returns the expected code at %d", async (time, expected) => {
    await expect(generateTotp(secret, time, 30, 8, sha1WithNode)).resolves.toBe(expected);
  });
});

describe("HMAC SHA-1", () => {
  it("matches node:crypto", async () => {
    const key = new TextEncoder().encode("key");
    const message = new TextEncoder().encode("The quick brown fox jumps over the lazy dog");
    const result = await hmacSha1(key, message, sha1WithNode);
    const hex = Array.from(result).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(hex).toBe(
      createHmac("sha1", "key").update("The quick brown fox jumps over the lazy dog").digest("hex")
    );
  });
});

describe("otpauth URI and timing", () => {
  it("parses issuer, account and secret", () => {
    expect(parseOtpauthUri("otpauth://totp/BancoSeguro:demo?secret=JBSWY3DPEHPK3PXP&issuer=BancoSeguro")).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      issuer: "BancoSeguro",
      account: "demo"
    });
  });

  it("returns a value between 1 and 30", () => {
    expect(secondsRemaining(0)).toBeGreaterThanOrEqual(1);
    expect(secondsRemaining(0)).toBeLessThanOrEqual(30);
  });
});

describe("RFC 7636 PKCE vector", () => {
  it("matches the S256 challenge without padding", () => {
    const verifier = "dBjftJeZ4CVP-mJ92TRMSWJ9ByHIsrsYYNyF4NLL2r8U";
    const challenge = base64UrlEncode(
      new Uint8Array(createHash("sha256").update(verifier).digest())
    );
    expect(challenge).toBe("P-u8PK4xTznR5VCbrEsvXcCgQe3k555r3TMc6uGjfhA");
  });
});
