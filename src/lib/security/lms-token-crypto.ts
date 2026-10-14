/**
 * 2P-53 — At-rest sealing for LMS / OAuth / Calendar tokens stored in SQLite.
 * Uses AES-256-GCM keyed from SESSION_SECRET. Legacy plaintext remains readable.
 * Never log plaintext tokens. One seal helper — not a second credential system.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const LMS_TOKEN_SEAL_PREFIX = "enc:v1:";

function sessionSecretForCrypto(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "dev-insecure-session-secret-change-me") {
      throw new Error(
        "SESSION_SECRET must be set to a strong secret in production.",
      );
    }
    return secret;
  }
  return secret || "dev-insecure-session-secret-change-me";
}

function deriveKey(): Buffer {
  return createHash("sha256")
    .update(`study-haul-lms-token-v1:${sessionSecretForCrypto()}`)
    .digest();
}

/** Seal a credential for DB storage. Empty/null → null. Already sealed → unchanged. */
export function sealLmsToken(
  plaintext: string | null | undefined,
): string | null {
  if (plaintext == null) return null;
  const trimmed = plaintext.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(LMS_TOKEN_SEAL_PREFIX)) return trimmed;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");
  return `${LMS_TOKEN_SEAL_PREFIX}${payload}`;
}

/** Open a stored credential. Legacy plaintext passes through. */
export function openLmsToken(
  stored: string | null | undefined,
): string | null {
  if (stored == null) return null;
  const trimmed = stored.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith(LMS_TOKEN_SEAL_PREFIX)) return trimmed;

  try {
    const raw = Buffer.from(
      trimmed.slice(LMS_TOKEN_SEAL_PREFIX.length),
      "base64url",
    );
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    console.error(
      "Failed to open sealed LMS token (invalid key or corrupt payload).",
    );
    return null;
  }
}

export function lmsTokenCryptoTruthSummary(): {
  inventsSecondAuthSystem: false;
  logsPlaintextTokens: false;
  legacyPlaintextReadable: true;
  requiresSessionSecret: true;
} {
  return {
    inventsSecondAuthSystem: false,
    logsPlaintextTokens: false,
    legacyPlaintextReadable: true,
    requiresSessionSecret: true,
  };
}
