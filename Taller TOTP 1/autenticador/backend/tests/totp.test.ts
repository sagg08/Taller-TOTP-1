import test from "node:test";
import assert from "node:assert/strict";
import { generateTotp, verifyTotp } from "../src/helpers/totp";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("RFC 6238 SHA-1 vectors", () => {
  const vectors = [
    [59_000, "94287082"],
    [1111111100000, "07081804"],
    [1111111111000, "14050471"],
    [1234567890000, "89005924"],
    [2000000000000, "69279037"],
    [20000000000000, "65353130"]
  ] as const;

  for (const [time, expected] of vectors) {
    assert.equal(generateTotp(secret, time, 8), expected);
  }
});

test("accepts adjacent TOTP windows", () => {
  const time = 59_000;
  assert.equal(verifyTotp(secret, generateTotp(secret, time - 30_000), time), true);
  assert.equal(verifyTotp(secret, generateTotp(secret, time + 30_000), time), true);
});
