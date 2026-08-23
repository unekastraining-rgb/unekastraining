import type { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, type SessionPayload, encodeSession } from "@/lib/auth/session-token";

const SESSION_DAYS = 30;

export function resolveSessionCookieSecure(
  forwardedProto?: string | null,
  requestUrl?: string,
): boolean {
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  if (requestUrl) {
    try {
      return new URL(requestUrl).protocol === "https:";
    } catch {
      return true;
    }
  }
  return true;
}

export function sessionCookieSecure(request: Request): boolean {
  return resolveSessionCookieSecure(
    request.headers.get("x-forwarded-proto"),
    request.url,
  );
}

export function attachSessionCookie(
  response: NextResponse,
  request: Request,
  payload: Omit<SessionPayload, "exp"> & { exp?: number },
) {
  const token = encodeSession({
    userId: payload.userId,
    exp: payload.exp ?? Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(request),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return response;
}

export function safeLoginRedirectPath(next: string | null | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}
