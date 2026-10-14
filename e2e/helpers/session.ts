import { createHmac } from "node:crypto";

/**
 * Mirror of src/lib/auth/session-token for Playwright.
 * MUST match playwright.config webServer SESSION_SECRET — do not read
 * process.env.SESSION_SECRET (dev .env may differ and break proxy auth).
 */
export const E2E_SESSION_SECRET = "e2e-session-secret-studyhaul-2p24";
export const SESSION_COOKIE_NAME = "sh_session";

export interface SessionPayload {
  userId: string;
  exp: number;
}

function sign(value: string) {
  return createHmac("sha256", E2E_SESSION_SECRET).update(value).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}
