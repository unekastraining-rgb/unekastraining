import { createHmac, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";

import { db } from "@/lib/db";

import { resolveSessionCookieSecure } from "@/lib/auth/session-cookie";
import {
  decodeSession as decodeSessionToken,
  encodeSession,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from "@/lib/auth/session-token";

export { decodeSessionToken as decodeSession, encodeSession, SESSION_COOKIE_NAME };
export type { SessionPayload };

const COOKIE_NAME = SESSION_COOKIE_NAME;
const SESSION_DAYS = 30;

function getSecret() {
  return process.env.SESSION_SECRET ?? "dev-insecure-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = encodeSession({
    userId,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: resolveSessionCookieSecure(headerStore.get("x-forwarded-proto")),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: resolveSessionCookieSecure(headerStore.get("x-forwarded-proto")),
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const payload = decodeSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!payload) return null;

  return db.user.findUnique({ where: { id: payload.userId } });
}

export function encodeOAuthState(data: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeOAuthState(state: string | null): Record<string, string> | null {
  if (!state) return null;
  const [body, signature] = state.split(".");
  if (!body || !signature || sign(body) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<
      string,
      string
    >;
  } catch {
    return null;
  }
}

export function oauthNonce() {
  return randomBytes(16).toString("hex");
}
