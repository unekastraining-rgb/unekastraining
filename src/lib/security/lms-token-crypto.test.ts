/**
 * 2P-53 — LMS token at-rest sealing.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LMS_TOKEN_SEAL_PREFIX,
  lmsTokenCryptoTruthSummary,
  openLmsToken,
  sealLmsToken,
} from "@/lib/security/lms-token-crypto";

describe("lms-token-crypto", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-session-secret-for-lms-crypto-2p53";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  });

  it("seals and opens a Moodle-shaped token", () => {
    const plain = "abcdef0123456789abcdef0123456789";
    const sealed = sealLmsToken(plain);
    expect(sealed).toBeTruthy();
    expect(sealed!.startsWith(LMS_TOKEN_SEAL_PREFIX)).toBe(true);
    expect(sealed).not.toContain(plain);
    expect(openLmsToken(sealed)).toBe(plain);
  });

  it("passes through legacy plaintext", () => {
    const plain = "abcdef0123456789abcdef0123456789";
    expect(openLmsToken(plain)).toBe(plain);
  });

  it("does not double-seal", () => {
    const once = sealLmsToken("abcdef0123456789abcdef0123456789")!;
    expect(sealLmsToken(once)).toBe(once);
  });

  it("truth: no second auth system; no plaintext logging contract", () => {
    const t = lmsTokenCryptoTruthSummary();
    expect(t.inventsSecondAuthSystem).toBe(false);
    expect(t.logsPlaintextTokens).toBe(false);
    expect(t.legacyPlaintextReadable).toBe(true);
  });
});
